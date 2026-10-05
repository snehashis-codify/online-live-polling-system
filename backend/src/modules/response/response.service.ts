import { and, eq } from "drizzle-orm";
import db from "../../common/config/db.js";
import { answerTable, responseTable } from "../../common/config/schema.js";
import type { AuthenticatedUser } from "../../common/types/express.js";
import ApiError from "../../common/util/api-error.util.js";
import type { SubmitResponseInput } from "./dto/submitResponse.dto.js";

const UNIQUE_VIOLATION = "23505";

class ResponseService {
  async submitResponse(
    pollId: string,
    userDetails: AuthenticatedUser | undefined,
    reqBody: SubmitResponseInput,
  ) {
    const { questionAns } = reqBody;
    const userId = userDetails ? userDetails.id : null;

    try {
      return await db.transaction(async (tx) => {
        let responseDetails: { responseId: string }[] | undefined;
        const existingResponseDetails = userId
          ? await tx
              .select({ responseId: responseTable.id })
              .from(responseTable)
              .where(
                and(
                  eq(responseTable.pollId, pollId),
                  eq(responseTable.respondentId, userId),
                ),
              )
          : undefined;
        const [existingResponse] = existingResponseDetails ?? [];
        if (existingResponse) {
          responseDetails = [existingResponse];
          const responseId = existingResponse.responseId;
          await tx
            .update(responseTable)
            .set({ updatedAt: new Date() })
            .where(eq(responseTable.id, responseId));
          await tx
            .delete(answerTable)
            .where(eq(answerTable.responseId, responseId));
        } else {
          responseDetails = await tx
            .insert(responseTable)
            .values({ pollId, respondentId: userId })
            .returning({ responseId: responseTable.id });
        }

        const insertedAnswerValues = questionAns.flatMap((val) => {
          if (!val.optionId || !responseDetails || !responseDetails[0]) {
            return [];
          }
          const responseId = responseDetails[0].responseId;
          return val.optionId.map((option) => ({
            responseId,
            optionId: option,
          }));
        });
        const answerDetails = insertedAnswerValues.length
          ? await tx
              .insert(answerTable)
              .values(insertedAnswerValues)
              .returning({ answerId: answerTable.id })
          : [];
        const [finalResponse] = responseDetails ?? [];
        return {
          responseId: finalResponse?.responseId,
          answerDetails,
        };
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw ApiError.conflict("You have already responded to this poll");
      }
      throw error;
    }
  }
}

export default ResponseService;
