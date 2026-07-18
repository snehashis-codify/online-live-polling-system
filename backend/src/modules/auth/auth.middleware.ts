import type { Request, Response, NextFunction } from "express";
import JWTUtil from "../../common/util/jwt.util.js";
import db from "../../common/config/db.js";
import { usersTable } from "../../common/config/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../common/util/api-error.util.js";
const jwtUtil = new JWTUtil();
const authenticate = async (req: Request, _: Response, next: NextFunction) => {
  try {
    const bearerToken = req.headers?.["authorization"] as string | undefined;
    if (!bearerToken) throw ApiError.conflict("Missing token");
    if (!bearerToken.startsWith("Bearer"))
      throw ApiError.conflict("Missing bearer");

    const token = bearerToken.split(" ")[1];
    if (!token) throw ApiError.conflict("Missing token");
    const decoded = jwtUtil.verifyAccessToken(token);
    if (!decoded || typeof decoded === "string")
      throw ApiError.unAuthenticated("Invalid token");

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId));
    if (!user) {
      throw ApiError.unAuthenticated("Unautenticated");
    }
    (req as any).user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (error) {
    throw ApiError.unAuthenticated("UnAuthenticated");
  }
};

export default authenticate;
