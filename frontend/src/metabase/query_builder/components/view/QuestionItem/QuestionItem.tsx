import React from "react";
import { QuestionItemRoot } from "./QuestionItem.styled";

type Props = {
  question: string;
  style: Record<string, any>;
};

export function QuestionItem({ question, style }: Props) {
  return (
    <div style={{ height: 33, ...style }}>
      <QuestionItemRoot>{question}</QuestionItemRoot>
    </div>
  );
}
