import type { Request, Response, NextFunction } from "express";
import JWTUtil from "../../common/util/jwt.util.js";
import db from "../../common/config/db.js";
import { usersTable } from "../../common/config/schema.js";
import { eq } from "drizzle-orm";
const jwtUtil = new JWTUtil();
const authenticate = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  const bearerToken = req.headers?.["authorization"] as string|undefined;
  if (!bearerToken) throw new Error("Missing token");
  if (!bearerToken.startsWith("Bearer")) throw new Error("Missing bearer");

  const token = bearerToken.split(" ")[1];
  if (!token) throw new Error("Missing token");
  const decoded = jwtUtil.verifyAccessToken(token);
  if (!decoded || typeof decoded === "string") throw new Error("Invalid token");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, decoded.userId));
  if (!user) {
    throw new Error("Unautenticated");
  }
  (req as any).user = {
    id: user.id,
    name: user.name,
    email: user.email,
  };
  next();
};

export default authenticate;
