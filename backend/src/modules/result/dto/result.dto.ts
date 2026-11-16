import type {
  optionsTable,
  questionTable,
} from "../../../common/config/schema.js";

type Question = typeof questionTable.$inferSelect;
type Option = typeof optionsTable.$inferSelect;

export interface OptionResult {
  optionId: Option["id"];
  optionTitle: Option["optionTitle"];
  answerCount: number;
}

export interface QuestionResult {
  questionId: Question["id"];
  questionTitle: Question["questionTitle"];
  questionType: Question["questionType"];
  options: OptionResult[];
}

export type PollResults = QuestionResult[];
