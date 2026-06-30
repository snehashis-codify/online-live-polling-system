import { eq } from "drizzle-orm";
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
      .where(eq(usersTable.id , user.id ))
      .returning({
        userId: usersTable.id ,
        name: usersTable.name,
        email: usersTable.email,
      });
    return { ...userWithToken, accessToken, refreshToken };
  }
}

export default AuthService;
