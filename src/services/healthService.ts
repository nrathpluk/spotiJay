import type { HealthStatus } from "../types/api";
import type { Env } from "../types/env";
import { MusicRepository } from "../repositories/musicRepository";
import { UserRepository } from "../repositories/userRepository";

export class HealthService {
  constructor(private readonly env: Env) {}

  async check(): Promise<HealthStatus> {
    const music = new MusicRepository(this.env);
    const users = new UserRepository(this.env);
    const r2 = await music.checkConnectivity();
    const kv = await users.checkConnectivity();
    return { status: "ok", bindings: { r2, kv } };
  }
}
