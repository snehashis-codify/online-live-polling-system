import { eq } from "drizzle-orm";
import db from "../../common/config/db.js";
import { answerTable, optionsTable, questionTable } from "../../common/config/schema.js";


class ResultService {
  async getPollResults(pollId: string) {
    const optionDetails=await db.select().from(answerTable).leftJoin(optionsTable,eq(answerTable.optionId,optionsTable.id)).leftJoin(questionTable,eq(optionsTable.questionId,questionTable.id))
  }
}

export default ResultService;
