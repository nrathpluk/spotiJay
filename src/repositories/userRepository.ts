import { CONFIG } from "../config/constants";
import type { Env } from "../types/env";

export interface StoredUser {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export class UserRepository {
  constructor(private readonly env: Env) {}

  async getByUsername(username: string): Promise<StoredUser | null> {
    const value = await this.env.USERS.get(this.userKey(username));
    return value ? JSON.parse(value) as StoredUser : null;
  }

  async create(user: StoredUser): Promise<void> {
    await this.env.USERS.put(this.userKey(user.username), JSON.stringify(user));
  }

  async checkConnectivity(): Promise<boolean> {
    const key = `${CONFIG.rateLimitKeyPrefix}health:${crypto.randomUUID()}`;
    await this.env.USERS.put(key, "1", { expirationTtl: 10 });
    const value = await this.env.USERS.get(key);
    return value === "1";
  }

  private userKey(username: string): string {
    return `${CONFIG.userKeyPrefix}${username.toLowerCase()}`;
  }
}
