import React, { useEffect,useState } from "react";
import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  Textarea,
  useDisclosure,
  Chip,
} from "@heroui/react";
import { IoAddOutline } from "react-icons/io5";
import { HiMagnifyingGlassPlus } from "react-icons/hi2";
import { TbMessageHeart } from "react-icons/tb";
import { PiBuildingsDuotone } from "react-icons/pi";
import { GiSpy } from "react-icons/gi";
import EnrichmentTable from "./Table";

interface Enrichment {
  title: string;
  description: string;
  icon: React.ReactNode;
  enrichmentName: string;
  aiModel: string;
  objective: string;
  isEdit?: boolean;
  index?: number;
  number?: number;
  createdAt?: number;
}

export default function MainPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [enrichments, setEnrichments] = useState<Enrichment[]>([]);
  const [modalContent, setModalContent] = useState<Enrichment | null>(null);
  const [enrichmentCounts, setEnrichmentCounts] = useState<
    Record<string, number>
  >({});
  const [inputValue, setInputValue] = useState<string>("");
  const [chips, setChips] = useState<string[]>([]);
  const [inValidEmails, setInValidEmails] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [inValid, setInvalid] = useState(false);
  const [lastErrorType, setLastErrorType] = useState<
    "duplicate" | "invalid" | null
  >(null);

  const handleCreateEnrichment = (modalContent: Enrichment | null) => {
    if (!modalContent) return;
    const type = modalContent.title;
    const currentCount = enrichmentCounts[type] || 0;
    const newCount = currentCount + 1;
    setEnrichmentCounts({ ...enrichmentCounts, [type]: newCount });
    setEnrichments((arr) => [
      ...arr,
      {
        ...modalContent,
        enrichmentName: `${type} ${newCount}`,
        number: newCount,
        createdAt: Date.now(),
      },
    ]);
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const recalculateErrorType = (chipsArr: string[], invalidArr: string[]) => {
    const validEmails = chipsArr.filter(isValidEmail);
    const hasDuplicates = validEmails.some(
      (item, idx, arr) => arr.indexOf(item) !== idx
    );
    if (hasDuplicates) {
      setLastErrorType("duplicate");
      setDuplicateEmail(true);
      setInvalid(invalidArr.length > 0);
      return;
    }
    if (invalidArr.length > 0) {
      setLastErrorType("invalid");
      setDuplicateEmail(false);
      setInvalid(true);
      return;
    }
    setLastErrorType(null);
    setDuplicateEmail(false);
    setInvalid(false);
  };

  const makeChip = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const text = inputValue.trim();
    if ((e.key === "Enter" || e.code === "Space") && text) {
      e.preventDefault();
      let isInvalid = !isValidEmail(text);
      setChips((prev) => {
        const newChips = [...prev, text];
        let newInvalids = inValidEmails;
        if (isInvalid) {
          newInvalids = [...inValidEmails, text];
          setInValidEmails(newInvalids);
        }
        recalculateErrorType(newChips, newInvalids);
        return newChips;
      });
      setInputValue("");
    }
    if (e.key === "Backspace" && !inputValue) {
      e.preventDefault();
      if (chips.length > 0) {
        const lastChip = chips[chips.length - 1];
        setChips((prev) => {
          const updatedChips = prev.slice(0, -1);
          let updatedInvalids = [...inValidEmails];
          const invalidIndex = updatedInvalids.indexOf(lastChip);
          if (invalidIndex !== -1) {
            updatedInvalids.splice(invalidIndex, 1);
            setInValidEmails(updatedInvalids);
          }
          recalculateErrorType(updatedChips, updatedInvalids);
          return updatedChips;
        });
        setInputValue(lastChip);
      }
    }
  };

  useEffect(() => {
    if (lastErrorType === "duplicate" && duplicateEmail) {
      setErrorMessage("You have duplicate emails.");
    } else if (lastErrorType === "invalid") {
      setErrorMessage(`Some emails are invalid: ${inValidEmails.join(", ")}`);
    } else {
      setErrorMessage("");
    }
  }, [lastErrorType, duplicateEmail, inValidEmails]);

  return (
    <>
      <div className="flex justify-center">
        <ButtonGroup size="md" radius="sm" variant="flat">
          <Dropdown>
            <DropdownTrigger>
              <Button>Enrich</Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Saved enrichments"
              items={enrichments}
              emptyContent={
                <span className="px-3 py-2 text-base text-gray-400">
                  No enrichments
                </span>
              }
              topContent={
                <div className="px-3 py-2 text-base font-bold text-gray-800 cursor-default select-none">
                  Enrich Now:
                </div>
              }
            >
              {(item) => (
                <DropdownItem
                  key={item.enrichmentName}
                  description={
                    item.createdAt
                      ? `Created ${Math.floor(
                          (Date.now() - item.createdAt) / 60000
                        )} min ago`
                      : "Created Just Now"
                  }
                  onPress={() => {
                    setModalContent({
                      ...item,
                      isEdit: true,
                      index: enrichments.findIndex(
                        (e) => e.enrichmentName === item.enrichmentName
                      ),
                    });
                    onOpen();
                  }}
                  startContent={item.icon}
                >
                  {item.enrichmentName}
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
          <Dropdown placement="bottom">
            <DropdownTrigger>
              <Button isIconOnly>
                <IoAddOutline />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Second button options"
              itemClasses={{ description: "max-w-48 whitespace-normal" }}
            >
              <DropdownItem
                key="option1"
                onPress={() => {
                  const type = "Deep Research Agent";
                  const currentCount = enrichmentCounts[type] || 0;
                  setModalContent({
                    title: "Deep Research Agent",
                    icon: (
                      <HiMagnifyingGlassPlus className="size-5 text-blue-700" />
                    ),
                    description:
                      "Human like deep digital research for any data point on web",
                    enrichmentName: `${type} ${currentCount + 1}`,
                    aiModel: "",
                    objective: "",
                  });
                  onOpen();
                }}
                description="Human like deep digital research for any data point on web"
                startContent={
                  <HiMagnifyingGlassPlus className="size-5 text-blue-700" />
                }
              >
                Deep Research Agent
              </DropdownItem>
              <DropdownItem
                key="optionB"
                onPress={() => {
                  const type = "AI Agent";
                  const currentCount = enrichmentCounts[type] || 0;
                  setModalContent({
                    title: type,
                    icon: <GiSpy className="size-5 text-blue-700" />,
                    description:
                      "Human like digital research for any data point on web",
                    enrichmentName: `${type} ${currentCount + 1}`,
                    aiModel: "",
                    objective: "",
                  });
                  onOpen();
                }}
                description="Human like digital research for any data point on web"
                startContent={<GiSpy className="size-5 text-blue-700" />}
              >
                AI Agent
              </DropdownItem>
              <DropdownItem
                key="optionC"
                onPress={() => {
                  const type = "LLM Prompt";
                  const currentCount = enrichmentCounts[type] || 0;
                  setModalContent({
                    title: "LLM Prompt",
                    icon: <TbMessageHeart className="size-5 text-blue-700" />,
                    description:
                      "Leverage Ai to process internal and external data",
                    enrichmentName: `${type}${currentCount + 1}`,
                    aiModel: "",
                    objective: "",
                  });
                  onOpen();
                }}
                description="Leverage Ai to process internal and external data"
                startContent={
                  <TbMessageHeart className="size-5 text-blue-700" />
                }
              >
                LLM Prompt
              </DropdownItem>
              <DropdownItem
                key="optionD"
                onPress={() => {
                  const type = "LinkedIn";
                  const currentCount = enrichmentCounts[type] || 0;
                  setModalContent({
                    title: "LinkedIn",
                    icon: (
                      <PiBuildingsDuotone className="size-5 text-blue-700" />
                    ),
                    description: "Augment company profiles with LinkedIn data",
                    enrichmentName: `${type} ${currentCount + 1}`,
                    aiModel: "",
                    objective: "",
                  });
                  onOpen();
                }}
                description="Augment company profiles with LinkedIn data"
                startContent={
                  <PiBuildingsDuotone className="size-5 text-blue-700" />
                }
              >
                LinkedIn
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </ButtonGroup>

        <Modal
          size="5xl"
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          hideCloseButton
        >
          <ModalContent>
            {(onClose) => (
              <div className="relative p-8 bg-white rounded-lg">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                  onClick={onClose}
                >
                  &times;
                </button>

                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{modalContent?.icon}</span>
                  <span className="text-xl font-semibold">
                    {modalContent?.title}
                  </span>
                </div>

                <div className="text-gray-500 text-sm mb-6">
                  {modalContent?.description}
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">
                      Enrichment Name
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={modalContent?.enrichmentName || ""}
                      onChange={(e) =>
                        setModalContent((c) =>
                          c ? { ...c, enrichmentName: e.target.value } : c
                        )
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">
                      AI Model
                    </label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={
                        modalContent?.aiModel || "Default (OpenAI GPT 4.1-mini)"
                      }
                      onChange={(e) =>
                        setModalContent((c) =>
                          c ? { ...c, aiModel: e.target.value } : c
                        )
                      }
                    >
                      <option value="Default (OpenAI GPT 4.1-mini)">
                        Default (OpenAI GPT 4.1-mini)
                      </option>
                      <option value="Claude 3.7">Claude 3.7</option>
                      <option value="Deep Seek">Deep Seek</option>
                    </select>
                  </div>
                </div>

                <div className="mb-2">
                  <Textarea
                    isInvalid={inValid}
                    errorMessage={errorMessage}
                    label="Objective for the agent :"
                    labelPlacement="outside"
                    className="w-full  px-2 py-1"
                    value={inputValue || ""}
                    onChange={(e) => {
                      setModalContent((c) =>
                        c ? { ...c, objective: e.target.value } : c
                      );
                      setInputValue(e.target.value);
                    }}
                    startContent={
                      <div className="flex  gap-1 items-center">
                        {chips.map((chip, index: number) => (
                          <Chip
                            key={index}
                            size="sm"
                            color="primary"
                            variant="shadow"
                            onClose={() => {
                              const updatedChips = chips.filter(
                                (_, i) => i !== index
                              );
                              
                              const invalidIndex = inValidEmails.indexOf(chip);
                              let updatedInvalids = [...inValidEmails];
                              if (invalidIndex !== -1) {
                                updatedInvalids.splice(invalidIndex, 1);
                              }
                              setChips(updatedChips);
                              setInValidEmails(updatedInvalids);
                              recalculateErrorType(
                                updatedChips,
                                updatedInvalids
                              );
                            }}
                          >
                            {chip}
                          </Chip>
                        ))}
                      </div>
                    }
                    placeholder="Press Enter or Space to add email"
                    onKeyDown={makeChip}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="light"
                    className="shadow-none border-none"
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                  {modalContent?.isEdit ? (
                    <Button
                      color="primary"
                      onPress={() => {
                        if (modalContent.index !== undefined) {
                          setEnrichments((arr) =>
                            arr.map((item, idx) =>
                              idx === modalContent.index
                                ? { ...modalContent }
                                : item
                            )
                          );
                        }
                        onClose();
                      }}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      onPress={() => {
                        handleCreateEnrichment(modalContent);
                        onClose();
                      }}
                      isDisabled={inValidEmails.length > 0}
                    >
                      Create
                    </Button>
                  )}
                </div>
              </div>
            )}
          </ModalContent>
        </Modal>
      </div>
      <EnrichmentTable enrichments={enrichments} />
    </>
  );
}
