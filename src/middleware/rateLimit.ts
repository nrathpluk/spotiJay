import { CONFIG } from "../config/constants";
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
  const key = `${CONFIG.rateLimitKeyPrefix}${ip}:${minute}`;
  const currentRaw = await context.env.USERS.get(key);
  const current = currentRaw ? Number.parseInt(currentRaw, 10) : 0;
  if (Number.isFinite(current) && current >= limitPerMinute) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", 429);
  }
  await context.env.USERS.put(key, String(current + 1), { expirationTtl: 120 });
}
