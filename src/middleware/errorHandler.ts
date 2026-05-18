import type { Logger } from "../utils/logger";
import { errorResponse } from "../utils/http";
import { toAppError } from "../utils/errors";

export function handleError(error: unknown, logger: Logger): Response {
  const appError = toAppError(error);
  const logContext = {
    code: appError.code,
    status: appError.status,
    message: appError.message,
  };

  if (appError.status >= 500) {
    logger.error("Request failed", logContext);
  } else {
    logger.warn("Request rejected", logContext);
  }

  return errorResponse(appError);
}
