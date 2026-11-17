import { and, eq } from "drizzle-orm";
import ApiError from "../../common/util/api-error.util.js";
import db from "../../common/config/db.js";

import { createHash, createHmac, randomBytes } from "node:crypto";
import JWTUtil from "../../common/util/jwt.util.js";
import { usersTable } from "../../common/config/schema.js";

const jwtUtil = new JWTUtil();

class AuthService {
  async register(reqBody: any) {
    const { name, email, password } = reqBody;
    const [isExistingEmail] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (isExistingEmail) {
      throw new Error("Email Id already exists");
    }
    const salt = randomBytes(32).toString("hex");
    const hashPassword = createHmac("sha256", salt)
      .update(password)
      .digest("hex");
    const [newUser] = await db
      .insert(usersTable)
      .values({ name, email, password: hashPassword, salt })
      .returning({ userId: usersTable.id });
    if (!newUser) {
      throw new Error("Error while registering user");
    }
    return newUser;
  }

  async login(reqBody: any) {
    const { email, password } = reqBody;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!user) {
      throw new Error("Invalid Email");
    }
    const salt = user.salt ?? randomBytes(32).toString("hex");
    const hashPassword = createHmac("sha256", salt)
      .update(password)
      .digest("hex");
    if (hashPassword !== user.password) {
      throw new Error("Invalid password");
    }
    const accessToken = jwtUtil.generateAccessToken({
      userId: user.id,
      name: user.name,
      email: user.email,
    });
    const refreshToken = jwtUtil.generateRefreshToken({ userId: user.id });
    const hashRefreshToken = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const [userWithToken] = await db
      .update(usersTable)
      .set({ refreshToken: hashRefreshToken })
      .where(eq(usersTable.id, user.id))
      .returning({
        userId: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      });
    return { ...userWithToken, accessToken, refreshToken };
  }

  // Rotation: every refresh issues a new refresh token and replaces the stored
  // hash, so the token just used can never be used again
  async refresh(
    user: { id: string; name: string; email: string },
    currentHash: string,
  ) {
    const accessToken = jwtUtil.generateAccessToken({
      userId: user.id,
      name: user.name,
      email: user.email,
    });
    const refreshToken = jwtUtil.generateRefreshToken({ userId: user.id });
    const newHash = createHash("sha256").update(refreshToken).digest("hex");

    // Matching on the old hash makes the swap atomic: if two requests race
    // with the same token, only the first one updates a row
    const [rotated] = await db
      .update(usersTable)
      .set({ refreshToken: newHash })
      .where(
        and(
          eq(usersTable.id, user.id),
          eq(usersTable.refreshToken, currentHash),
        ),
      )
      .returning({ id: usersTable.id });
    if (!rotated) {
      throw ApiError.unAuthenticated("Refresh token already used");
    }
    return { accessToken, refreshToken };
  }

  // Revokes the session by clearing the stored hash. refreshMiddleware has
  // already verified the caller holds the current refresh token.
  async logout(userId: string) {
    await db
      .update(usersTable)
      .set({ refreshToken: null })
      .where(eq(usersTable.id, userId));
  }
}

export default AuthService;
