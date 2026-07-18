import { randomBytes } from "node:crypto";
import db from "../../common/config/db.js";
import {
  optionsTable,
  pollTable,
  questionTable,
} from "../../common/config/schema.js";

import { eq } from "drizzle-orm";
import type {
  CreatePollInput,
  CreatePollOutput,
} from "./dto/createPoll.dto.js";
import type { GetPollsOutput } from "./dto/getPolls.dto.js";
import type { GetPollDetailOutput } from "./dto/getPollDetail.dto.js";
import { isPollOpen } from "./util/isPollOpen.util.js";
import ApiError from "../../common/util/api-error.util.js";
import type { ActivatePollInput } from "./dto/activatePoll.dto.js";

class PollService {
  async create(
    reqBody: CreatePollInput,
    user: any,
  ): Promise<CreatePollOutput | undefined> {
    const { id } = user;
    const { title, questions } = reqBody;
    const link = randomBytes(16).toString("hex");
    const response = await db.transaction(async (tx) => {
      const [pollData] = await tx
        .insert(pollTable)
        .values({ creatorId: id, title, linkToken: link })
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
        sharedLink: `${process.env.FRONTEND_BASE_URL}/polls/${link}`,
      };
    });
    return response;
  }
  async getAllPolls(user: any): Promise<GetPollsOutput> {
    const { id } = user;
    const response = await db
      .select({
        id: pollTable.id,
        title: pollTable.title,
        status: pollTable.status,
        expTime: pollTable.expTime,
      })
      .from(pollTable)
      .where(eq(pollTable.creatorId, id));

    return response;
  }
  async getPollDetails(
    pollId: string,
  ): Promise<GetPollDetailOutput | undefined> {
    const response = await db
      .select()
      .from(pollTable)
      .where(eq(pollTable.id, pollId))
      .leftJoin(questionTable, eq(pollTable.id, questionTable.pollId))
      .leftJoin(optionsTable, eq(questionTable.id, optionsTable.questionId));
    const filterDuplicatePoll = response
      .flatMap((row) => row.polls)
      .filter(
        (poll, index, self) =>
          index === self.findIndex((u) => u.id === poll.id),
      );
    const quesRes = response.flatMap((quesRow) => quesRow.questions!);
    const optionRes = response.flatMap((o) => o.options!);
    if (!filterDuplicatePoll || filterDuplicatePoll.length <= 0) return;
    if (!quesRes || quesRes.length <= 0) return;
    if (!optionRes || optionRes.length <= 0) return;
    const { id, title, status, expTime, responseMode, linkToken } =
      filterDuplicatePoll[0]!;
    let pollDetails = {
      id,
      title,
      status,
      expTime,
      responseMode,
      sharedLink: `${process.env.FRONTEND_BASE_URL}/${linkToken}`,
      isOpen: isPollOpen(expTime, status),
      questions: quesRes
        .filter((q) => q.pollId === id)
        .filter(
          (question, index, self) =>
            index === self.findIndex((q) => q.id === question.id),
        )
        .map((question) => {
          return {
            id: question.id,
            questionTitle: question.questionTitle,
            questionType: question.questionType!,
            isMandatory: question.isMandatory,
            options: optionRes
              .filter((o) => o.questionId === question.id)
              .map((o) => {
                return {
                  id: o.id,
                  title: o.optionTitle,
                  value: o.optionValue,
                };
              }),
          };
        }),
    };

    return pollDetails;
  }
  async activatePoll(reqBody: ActivatePollInput, pollId: string) {
    const { durationMinutes } = reqBody;
    const response = await db
      .select()
      .from(pollTable)
      .where(eq(pollTable.id, pollId))
      .leftJoin(questionTable, eq(pollTable.id, questionTable.pollId));
    const filterDuplicatePoll = response
      .flatMap((row) => row.polls)
      .filter(
        (poll, index, self) =>
          index === self.findIndex((u) => u.id === poll.id),
      );
    const quesRes = response
      .flatMap((quesRow) => (quesRow.questions ? quesRow.questions : null))
      .filter((val) => val !== null);
    if (!filterDuplicatePoll || filterDuplicatePoll.length <= 0) return;
    if (!quesRes || quesRes.length <= 0)
      throw ApiError.badRequest(
        "This poll doesn't have questions. Kindly add it before activating the poll",
      );
    const { status } = filterDuplicatePoll[0]!;

    if (status !== "draft")
      throw ApiError.conflict(
        "Can't activate the poll with status as active/closed",
      );
    const currentDate = new Date();
    const expDate = new Date(currentDate.getTime() + durationMinutes * 60000);
    await db
      .update(pollTable)
      .set({ status: "active", expTime: expDate })
      .where(eq(pollTable.id, pollId));
  }
}
export default PollService;
