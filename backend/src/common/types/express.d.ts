import type { pollTable, usersTable } from "../config/schema.js";

type AuthenticatedUser = Pick<
  typeof usersTable.$inferSelect,
  "id" | "name" | "email"
>;
export type PollRow = typeof pollTable.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      poll?: PollRow;
    }
  }
}
