import type { NextFunction, Request, Response } from "express";
import type { SubmitResponseInput } from "./dto/submitResponse.dto.js";
import db from "../../common/config/db.js";
import {
  optionsTable,
  questionTable,
  responseTable,
} from "../../common/config/schema.js";
import { and, eq, inArray } from "drizzle-orm";
import ApiError from "../../common/util/api-error.util.js";
export const checkMandatoryQuestionStatus = async (
  req: Request<{}, {}, SubmitResponseInput>,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.poll!;
    const pollQuestionsWithOptions = await db
      .select()
      .from(questionTable)
      .where(eq(questionTable.pollId, id))
      .innerJoin(optionsTable, eq(questionTable.id, optionsTable.questionId));

    const pollQuestions = pollQuestionsWithOptions.reduce(
      (
        acc: Record<string, { isMandatory: boolean; optionIds: string[] }>,
        curr,
      ) => {
        const existing = acc[curr.questions.id];
        const optionIds = existing ? existing.optionIds : [];
        optionIds.push(curr.options.id);
        acc[curr.questions.id] = {
          isMandatory: curr.questions.isMandatory,
          optionIds,
        };
        return acc;
      },
      {},
    );

    const { questionAns } = req.body;
    const pollQuesIds = Object.keys(pollQuestions);
    if (questionAns.length !== pollQuesIds.length) {
      throw ApiError.badRequest(
        "Answers must be provided for all questions in the poll",
      );
    }

    const invalidQuestion = questionAns.some(
      (val) => !pollQuestions[val.quesId],
    );
    if (invalidQuestion) {
      throw ApiError.conflict("Invalid questions");
    }

    const invalidOption = questionAns.some((val) => {
      if (!val.optionId) return false;
      const validOptionIds = pollQuestions[val.quesId]!.optionIds;
      return val.optionId.some((optionId) => !validOptionIds.includes(optionId));
    });
    if (invalidOption) {
      throw ApiError.conflict("Invalid options");
    }

    const isMandatoryQuesCheck = questionAns.find((val) => {
      const question = pollQuestions[val.quesId]!;
      return question.isMandatory && (!val.optionId || val.optionId.length <= 0);
    });
    if (isMandatoryQuesCheck) {
      throw ApiError.forbidden("Please answer all the mandatory questions");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const reSubmissionGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    const pollDetails = req.poll!;
    if (!user) {
      next();
      return;
    }
    const { id: userId } = user;
    const { id: pollId } = pollDetails;
    const isReSubmit = await db
      .select({ responseId: responseTable.id })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.pollId, pollId),
          eq(responseTable.respondentId, userId),
        ),
      );
    if (isReSubmit.length > 0) {
      throw ApiError.conflict("You have already responded to this poll");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const optionsRangeGuard = async (
  req: Request<{}, {}, SubmitResponseInput>,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const { questionAns } = req.body;
    const multiOptionsQues = questionAns.filter(
      (val) => val.optionId && val.optionId.length > 1,
    );
    if (multiOptionsQues.length <= 0) {
      next();
      return;
    }
    const quesIds = multiOptionsQues.map((val) => val.quesId);
    const response = await db
      .select()
      .from(questionTable)
      .where(
        and(
          inArray(questionTable.id, [...quesIds]),
          eq(questionTable.questionType, "checkbox"),
        ),
      );
    if (response.length <= 0 || response.length !== quesIds.length) {
      throw ApiError.conflict(
        "Option with radio type should have single answer",
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
