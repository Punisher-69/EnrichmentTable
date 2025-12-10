import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

type ParagraphElement = {
  type: "paragraph";
  children: CustomText[];
};

type ChipElement = {
  type: "chip";
  value: string;
  id:string;
  children: CustomText[];
};

type CustomElement = ParagraphElement | ChipElement;
type CustomText = {
  text: string;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
