class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(message = "Bad Request") {
    return new ApiError(400, message);
  }
  static unAuthorized(message = "UnAuthorized") {
    return new ApiError(401, message);
  }
  static unAuthenticated(message = "UnAuthenticated") {
    return new ApiError(401, message);
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not Found") {
    return new ApiError(404, message);
  }
}
export default ApiError;
