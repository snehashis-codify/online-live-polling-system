import { asc, count, eq } from "drizzle-orm";
import db from "../../common/config/db.js";
import {
  answerTable,
  optionsTable,
  questionTable,
} from "../../common/config/schema.js";
import type { PollResults } from "./dto/result.dto.js";

class ResultService {
  async getPollResults(pollId: string): Promise<PollResults> {
    const rows = await db
      .select({
        optionId: optionsTable.id,
        questionId: questionTable.id,
        questionType: questionTable.questionType,
        answerCount: count(answerTable.id),
        questionTitle: questionTable.questionTitle,
        optionTitle: optionsTable.optionTitle,
      })
      .from(optionsTable)
      .innerJoin(questionTable, eq(questionTable.id, optionsTable.questionId))
      .leftJoin(answerTable, eq(answerTable.optionId, optionsTable.id))
      .where(eq(questionTable.pollId, pollId))
      .groupBy(optionsTable.id, questionTable.id)
      .orderBy(
        asc(questionTable.createdAt),
        asc(questionTable.id),
        asc(optionsTable.createdAt),
      );

    return rows.reduce<PollResults>((acc, curr) => {
      let question = acc.find((q) => q.questionId === curr.questionId);
      if (!question) {
        question = {
          questionId: curr.questionId,
          questionTitle: curr.questionTitle,
          questionType: curr.questionType,
          options: [],
        };
        acc.push(question);
      }
      question.options.push({
        optionId: curr.optionId,
        optionTitle: curr.optionTitle,
        answerCount: curr.answerCount,
      });
      return acc;
    }, []);
  }
}

export default ResultService;
