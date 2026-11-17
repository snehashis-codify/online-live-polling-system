import { asc, count, countDistinct, eq } from "drizzle-orm";
import db from "../../common/config/db.js";
import {
  answerTable,
  optionsTable,
  questionTable,
} from "../../common/config/schema.js";
import type { PollResults } from "./dto/result.dto.js";

class ResultService {
  async getPollResults(pollId: string): Promise<PollResults> {
    const [rows, totals] = await Promise.all([
      // per-option answer counts (options with 0 answers included via left join)
      db
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
          asc(questionTable.position),
          asc(questionTable.id),
          asc(optionsTable.position),
          asc(optionsTable.id),
        ),
      // per-question distinct respondents (denominator for percentages)
      db
        .select({
          questionId: questionTable.id,
          totalRespondents: countDistinct(answerTable.responseId),
        })
        .from(optionsTable)
        .innerJoin(questionTable, eq(questionTable.id, optionsTable.questionId))
        .leftJoin(answerTable, eq(answerTable.optionId, optionsTable.id))
        .where(eq(questionTable.pollId, pollId))
        .groupBy(questionTable.id),
    ]);

    const totalsByQuestion = new Map(
      totals.map((t) => [t.questionId, t.totalRespondents]),
    );

    return rows.reduce<PollResults>((acc, curr) => {
      let question = acc.find((q) => q.questionId === curr.questionId);
      if (!question) {
        question = {
          questionId: curr.questionId,
          questionTitle: curr.questionTitle,
          questionType: curr.questionType,
          totalRespondents: totalsByQuestion.get(curr.questionId) ?? 0,
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
