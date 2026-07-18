import type { Response } from "express";
class ApiResponse {
  static ok<T>(res: Response, data: T | null, message: string) {
    return res.status(200).json({ message, data });
  }
  static created<T>(res: Response, data: T, message: string) {
    return res.status(201).json({ message, data });
  }
  static noContent(res: Response) {
    return res.status(204).send();
  }
}

export default ApiResponse