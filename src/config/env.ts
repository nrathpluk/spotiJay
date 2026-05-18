import { CONFIG } from "./constants";
import type { Env } from "../types/env";

export interface RuntimeConfig {
  corsOrigins: string[];
  streamUrlTtlSeconds: number;
  rateLimitPerMinute: number;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function validateEnv(env: Env): RuntimeConfig {
  if (!env) throw new Error("Missing Worker environment bindings");
  if (!env.MUSIC_BUCKET) throw new Error("Missing required R2 binding: MUSIC_BUCKET");
  if (!env.USERS) throw new Error("Missing required KV binding: USERS");
  if (!env.AUTH_SECRET) throw new Error("Missing required secret: AUTH_SECRET");

  const corsOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [...CONFIG.allowedCorsOrigins];

  return {
    corsOrigins,
    streamUrlTtlSeconds: parsePositiveInteger(
      env.STREAM_URL_TTL_SECONDS,
      CONFIG.streamUrlTtlSeconds
    ),
    rateLimitPerMinute: parsePositiveInteger(
      env.RATE_LIMIT_PER_MINUTE,
      CONFIG.rateLimitPerMinute
    ),
  };
}
