import { RateLimitRepository } from "../repositories/rateLimitRepository";
import type { RequestContext } from "../types/context";
import { AppError } from "../utils/errors";

function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function rateLimit(context: RequestContext, limitPerMinute: number): Promise<void> {
  const ip = getClientIp(context.request);
  const minute = Math.floor(Date.now() / 60000);
  const repository = new RateLimitRepository(context.env);
  const count = await repository.increment(ip, minute);
  if (count > limitPerMinute) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", 429);
  }
}
