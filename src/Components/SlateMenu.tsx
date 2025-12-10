import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  createEditor,
  Editor,
  Transforms,
  Range,
  Element as SlateElement,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  type RenderLeafProps,
  type RenderElementProps,
} from "slate-react";
import {
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { v4 as uuid } from "uuid";

const COMMANDS = ["😊 Emoji", "📌 Task", "🔗 Link"];

const withChips = (editor: Editor) => {
  const { isInline } = editor;
  editor.isInline = (element) => element.type === "chip" || isInline(element);
  return editor;
};

export default function SlashChipEditor() {
  const editor = useMemo(() => withChips(withReact(createEditor())), []);
  const [value, setValue] = useState<Editor["children"]>([
    {
      type: "paragraph",
      children: [{ text: "" }],
    },
  ]);
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedChip, setSelectedChip] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const editableRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  
  useEffect(() => {
    if (target && editableRef.current) {
      try {
        const domRange = window.getSelection()?.getRangeAt(0);
        if (domRange) {
          const rect = domRange.getBoundingClientRect();
          const editableRect = editableRef.current.getBoundingClientRect();

          setDropdownPosition({
            top: rect.bottom - editableRect.top + 5,
            left: rect.left - editableRect.left,
          });
        }
      } catch (error) {
        // Fallback positioning
        setDropdownPosition({ top: 20, left: 0 });
      }
    }
  }, [target]);

  const renderElement = useCallback(
    (props: RenderElementProps) => {
      switch (props.element.type) {
        case "chip":
          return (
            <ChipElement
              {...props}
              editor={editor}
              onChipClick={(chipData) => {
                setSelectedChip(chipData);
                onOpen();
              }}
            />
          );
        default:
          return <DefaultElement {...props} />;
      }
    },
    [editor, onOpen]
  );

  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    []
  );

  const insertChip = (cmd: string) => {
    const id = uuid();
    Transforms.select(editor, target!);
    Transforms.insertNodes(editor, {
      type: "chip",
      value: cmd,
      id,
      children: [{ text: "" }],
    });
    Transforms.insertText(editor, " ");

    // Ensure cursor is positioned after the space
    const { selection } = editor;
    if (selection) {
      const nextPoint = Editor.after(editor, selection.focus);
      if (nextPoint) {
        Transforms.select(editor, nextPoint);
      }
    }

    setTarget(null);
    setSearch("");
    setIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (target) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filtered.length > 0) {
          insertChip(filtered[index]);
        } else {
          // Close dropdown when Enter is pressed and no results found
          setTarget(null);
          setSearch("");
          setIndex(0);
        }
      } else if (e.key === "Escape" || e.key === " ") {
        e.preventDefault();

        // If space is pressed, move cursor forward and close dropdown
        if (e.key === " ") {
          setTarget(null);
          setSearch("");
          setIndex(0);
          // Insert a space and move cursor
          Transforms.insertText(editor, " ");
        } else {
          setTarget(null);
          setSearch("");
          setIndex(0);
        }
      }
    } else if (e.key === "Backspace") {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        e.preventDefault();

        const currentPoint = selection.focus;
        const currentPath = currentPoint.path;

        // First, check if we're at the beginning of a text node and there's a chip before it
        if (currentPoint.offset === 0) {
          try {
            // Get the previous node at the same level
            const parentPath = currentPath.slice(0, -1);
            const currentIndex = currentPath[currentPath.length - 1];

            if (currentIndex > 0) {
              const prevNodePath = [...parentPath, currentIndex - 1];
              const [prevNode] = Editor.node(editor, prevNodePath);

              if (
                SlateElement.isElement(prevNode) &&
                prevNode.type === "chip"
              ) {
                Transforms.removeNodes(editor, { at: prevNodePath });
                return;
              }
            }
          } catch (error) {
            // Continue to other methods if this fails
          }
        }

        // Second method: use Editor.before to find what's immediately before cursor
        const beforePoint = Editor.before(editor, currentPoint, {
          unit: "character",
        });

        if (beforePoint) {
          try {
            // Check if the before point is in a different node (likely a chip)
            if (beforePoint.path.toString() !== currentPoint.path.toString()) {
              const [beforeNode, beforePath] = Editor.node(editor, beforePoint);

              if (
                SlateElement.isElement(beforeNode) &&
                beforeNode.type === "chip"
              ) {
                Transforms.removeNodes(editor, { at: beforePath });
                return;
              }
            }

            // If it's in the same text node, check if there's text to delete
            const range = { anchor: beforePoint, focus: currentPoint };
            const text = Editor.string(editor, range);

            if (text && text.length > 0) {
              Transforms.delete(editor, { at: range });
              return;
            }
          } catch (error) {
            // Continue to next method
          }
        }

        // Third method: check if we're inside a chip
        const [currentNode, currentNodePath] = Editor.node(
          editor,
          currentPoint
        );
        if (
          SlateElement.isElement(currentNode) &&
          currentNode.type === "chip"
        ) {
          Transforms.removeNodes(editor, { at: currentNodePath });
          return;
        }

        // Final fallback: try to find any chip node that's immediately before
        try {
          const allNodes = Array.from(
            Editor.nodes(editor, {
              at: [],
              match: (n) => SlateElement.isElement(n) && n.type === "chip",
            })
          );

          // Find the chip that's closest before our current position
          let chipToDelete = null;
          for (const [, path] of allNodes) {
            const chipEnd = Editor.end(editor, path);
            const afterChip = Editor.after(editor, chipEnd);

            if (
              afterChip &&
              afterChip.path.toString() === currentPoint.path.toString() &&
              afterChip.offset === currentPoint.offset
            ) {
              chipToDelete = path;
              break;
            }
          }

          if (chipToDelete) {
            Transforms.removeNodes(editor, { at: chipToDelete });
            return;
          }
        } catch (error) {
          // Continue to default behavior
        }

        // Default behavior: delete one character if possible
        if (beforePoint) {
          try {
            Transforms.delete(editor, {
              at: { anchor: beforePoint, focus: currentPoint },
            });
          } catch (error) {
            // Last resort: just move cursor back
            Transforms.select(editor, beforePoint);
          }
        }
      }
    }
  };

  const onChange = (newVal: any) => {
    setValue(newVal);
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);

      // Get the current line text to check for slash commands
      const [node] = Editor.node(editor, selection);
      if (
        Editor.isEditor(node) ||
        !node ||
        (SlateElement.isElement(node) && node.type !== "paragraph")
      ) {
        setTarget(null);
        setSearch("");
        setIndex(0);
        return;
      }

      // Get the text from start of current text node to cursor
      const path = selection.focus.path;
      const offset = selection.focus.offset;

      try {
        const [textNode] = Editor.node(editor, path);
        if (
          textNode &&
          !Editor.isEditor(textNode) &&
          !SlateElement.isElement(textNode) &&
          "text" in textNode
        ) {
          const textUpToCursor = textNode.text.slice(0, offset);
          const slashIndex = textUpToCursor.lastIndexOf("/");

          if (slashIndex !== -1) {
            // Found a slash, extract the search term
            const searchTerm = textUpToCursor.slice(slashIndex + 1);

            // Don't show dropdown if search term contains spaces or is just spaces
            if (searchTerm.includes(" ") || searchTerm.trim() !== searchTerm) {
              setTarget(null);
              setSearch("");
              setIndex(0);
              return;
            }

            // Create target range from slash to cursor
            const slashPoint = { path, offset: slashIndex };
            setTarget({ anchor: slashPoint, focus: start });
            setSearch(searchTerm);
            setIndex(0);
            return;
          }
        }
      } catch (error) {
        // Fallback to previous method if there are issues
        const before = Editor.before(editor, start, { unit: "character" });
        if (before) {
          const charBefore = Editor.string(editor, {
            anchor: before,
            focus: start,
          });

          if (charBefore === "/") {
            setTarget({ anchor: before, focus: start });
            setSearch("");
            setIndex(0);
            return;
          }
        }
      }
    }

    setTarget(null);
    setSearch("");
    setIndex(0);
  };

  return (
    <>
      <div className="relative p-4 border rounded-md shadow-sm max-w-xl mx-auto mt-6">
        <Slate editor={editor} initialValue={value} onChange={onChange}>
          <div ref={editableRef} className="relative">
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onKeyDown={handleKeyDown}
              className="h-[350px] p-2 border rounded-md focus:outline-none"
            />
            {target && (
              <div
                className="absolute z-10 bg-white shadow-lg border rounded-md w-60"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                }}
              >
                {filtered.length > 0 ? (
                  filtered.map((c, i) => (
                    <div
                      key={c}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${
                        i === index ? "bg-blue-200 font-medium" : ""
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertChip(c);
                      }}
                    >
                      {c}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No commands found
                  </div>
                )}
              </div>
            )}
          </div>
        </Slate>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Chip Details
          </ModalHeader>
          <ModalBody>
            {selectedChip && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">Selected Chip:</h4>
                  <p className="text-gray-600">{selectedChip.value}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Chip ID:</h4>
                  <p className="text-sm text-gray-500 font-mono">
                    {selectedChip.id}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Description:</h4>
                  <p className="text-gray-600">
                    This is a dummy description for the selected chip. You can
                    add more details here such as creation date, last modified,
                    or any other relevant information.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Status:</h4>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

const Leaf = ({ attributes, children }: RenderLeafProps) => (
  <span {...attributes}>{children}</span>
);

const DefaultElement = ({ attributes, children }: RenderElementProps) => (
  <p {...attributes} className="my-2 leading-relaxed">
    {children}
  </p>
);

const ChipElement = ({
  attributes,
  children,
  element,
  editor,
  onChipClick,
}: RenderElementProps & {
  editor: Editor;
  onChipClick: (chipData: any) => void;
}) => {
  const { value, id } = element as any;

  const handleClose = () => {
    const [match] = Editor.nodes(editor, {
      at: [],
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n.type === "chip" &&
        n.id === id,
    });

    if (match) {
      const [, path] = match;
      Transforms.removeNodes(editor, { at: path });
    }
  };

  const handleChipClick = () => {
    onChipClick({ value, id });
  };

  return (
    <span {...attributes} contentEditable={false} className="inline-block mr-1">
      <Chip
        color="primary"
        variant="solid"
        onClose={handleClose}
        onClick={handleChipClick}
        className="inline-flex items-center cursor-pointer"
      >
        {value}
      </Chip>
      {children}
    </span>
  );
};
