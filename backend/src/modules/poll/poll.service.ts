import { createHash, randomBytes } from "node:crypto";
import db from "../../common/config/db.js";
import {
  optionsTable,
  pollTable,
  questionTable,
} from "../../common/config/schema.js";
import type {
  CreatePollInput,
  CreatePollOutput,
} from "./poll.model.js";

class PollService {
  async create(
    reqBody: CreatePollInput,
    user: any,
  ): Promise<CreatePollOutput | undefined> {
    const { id } = user;
    const { title, questions } = reqBody;
    const link = randomBytes(16).toString("hex");
    const hashLink = createHash("sha256").update(link).digest("hex");
    const response = await db.transaction(async (tx) => {
      const [pollData] = await tx
        .insert(pollTable)
        .values({ creatorId: id, title, hashLink })
        .returning({ pollId: pollTable.id });

      if (!pollData) {
        tx.rollback();
      }

      const questionData = await tx
        .insert(questionTable)
        .values(
          questions.map((q) => ({
            questionTitle: q.questionTitle,
            questionType: q.questionType,
            pollId: pollData!.pollId,
          })),
        )
        .returning({ questionId: questionTable.id });

      if (questionData.length !== questions.length) {
        tx.rollback();
      }

      const insertedOptionsValues = questionData.flatMap((question, index) => {
        const q = questions[index]!;
        return q.options.map((option) => ({
          questionId: question.questionId,
          optionTitle: option.title,
          optionValue: option.value,
        }));
      });

      const optionsData = await tx
        .insert(optionsTable)
        .values(insertedOptionsValues)
        .returning({ optionId: optionsTable.id });

      if (optionsData.length !== insertedOptionsValues.length) {
        tx.rollback();
      }

      return {
        pollId: pollData!.pollId,
        sharedLink: `${process.env.FRONTEND_BASE_URL}/polls/${hashLink}`,
      };
    });
    return response;
  }

}
export default PollService;
