import { CONFIG } from "../config/constants";
import type { Env } from "../types/env";

export class RateLimitRepository {
  constructor(private readonly env: Env) {}

  async increment(ip: string, minute: number): Promise<number> {
    const key = `${CONFIG.rateLimitKeyPrefix}${ip}:${minute}`;
    const currentRaw = await this.env.USERS.get(key);
    const current = currentRaw ? Number.parseInt(currentRaw, 10) : 0;
    const next = Number.isFinite(current) ? current + 1 : 1;
    await this.env.USERS.put(key, String(next), { expirationTtl: 120 });
    return next;
  }
}
