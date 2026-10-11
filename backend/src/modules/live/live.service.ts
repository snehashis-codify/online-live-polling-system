import { and, eq } from "drizzle-orm";
import db from "../../common/config/db.js";
import { pollTable, responseTable, usersTable } from "../../common/config/schema.js";

class LiveService {
  async userExists(userId: string) {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    return !!user;
  }

  async getPoll(pollId: string) {
    const [poll] = await db
      .select({
        id: pollTable.id,
        creatorId: pollTable.creatorId,
        status: pollTable.status,
        expTime: pollTable.expTime,
      })
      .from(pollTable)
      .where(eq(pollTable.id, pollId));
    return poll;
  }

  async hasResponded(pollId: string, userId: string) {
    const [response] = await db
      .select({ id: responseTable.id })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.pollId, pollId),
          eq(responseTable.respondentId, userId),
        ),
      )
      .limit(1);
    return !!response;
  }
}

export default LiveService;
