import "dotenv/config";
import jwt from "jsonwebtoken";
type ExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;
class JWTUtil {
  generateAccessToken(payload: any) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const exp = process.env.ACCESS_TOKEN_EXP;
    if (!secret) {
      throw new Error("Missing ACCESS_TOKEN_SECRET");
    }

    if (!exp) {
      throw new Error("Missing ACCESS_TOKEN_EXP");
    }
    const options = {} as jwt.SignOptions;

    options.expiresIn = exp as ExpiresIn;
    return jwt.sign(payload, secret, options);
  }
  generateRefreshToken(payload: any) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const exp = process.env.REFRESH_TOKEN_EXP;
    if (!secret) {
      throw new Error("Missing REFRESH_TOKEN_SECRET");
    }

    if (!exp) {
      throw new Error("Missing REFRESH_TOKEN_EXP");
    }
    const options = {} as jwt.SignOptions;

    options.expiresIn = exp as ExpiresIn;
    return jwt.sign(payload, secret, options);
  }
  verifyAccessToken(token: string) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new Error("Missing ACCESS_TOKEN_SECRET");
    }
    const decoded = jwt.verify(token, secret);
    return decoded;
  }
}

export default JWTUtil;
