import { CONFIG } from "../config/constants";
import type { AuthResult, SessionUser } from "../types/api";
import type { Env } from "../types/env";
import { hmacSign, sha256, timingSafeEqual } from "../utils/crypto";
import { AppError } from "../utils/errors";
import type { CredentialsInput } from "../utils/validation";
import { UserRepository } from "../repositories/userRepository";

export class AuthService {
  private readonly users: UserRepository;

  constructor(private readonly env: Env) {
    this.users = new UserRepository(env);
  }

  async register(credentials: CredentialsInput): Promise<AuthResult> {
    const existing = await this.users.getByUsername(credentials.username);
    if (existing) throw new AppError("USERNAME_TAKEN", "Username already taken", 409);

    const passwordHash = await this.hashPassword(credentials.password, credentials.username);
    await this.users.create({
      username: credentials.username,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    const token = await this.createToken(credentials.username);
    return this.authResult(credentials.username, token);
  }

  async login(credentials: CredentialsInput): Promise<AuthResult> {
    const stored = await this.users.getByUsername(credentials.username);
    if (!stored) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid username or password", 401);
    }

    const hash = await this.hashPassword(credentials.password, credentials.username);
    if (!timingSafeEqual(hash, stored.passwordHash)) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid username or password", 401);
    }

    const token = await this.createToken(stored.username);
    return this.authResult(stored.username, token);
  }

  async verifyToken(token: string): Promise<SessionUser> {
    try {
      const decoded = atob(token);
      const lastPipe = decoded.lastIndexOf("|");
      if (lastPipe < 0) throw new Error("Missing signature");

      const payload = decoded.substring(0, lastPipe);
      const sig = decoded.substring(lastPipe + 1);
      const expected = await hmacSign(this.env.AUTH_SECRET, payload);
      if (!timingSafeEqual(sig, expected)) {
        throw new Error("Invalid signature");
      }

      const firstPipe = payload.indexOf("|");
      if (firstPipe < 0) throw new Error("Invalid payload");
      const username = payload.substring(0, firstPipe);
      const ts = Number.parseInt(payload.substring(firstPipe + 1), 10);
      if (!Number.isFinite(ts) || Date.now() - ts > CONFIG.authTokenTtlMs) {
        throw new Error("Expired token");
      }

      return { username, isAdmin: this.isAdmin(username) };
    } catch {
      throw new AppError("INVALID_TOKEN", "Invalid or expired token", 401);
    }
  }

  async createStreamSignature(name: string, expiresAt: number): Promise<string> {
    return hmacSign(this.env.AUTH_SECRET, `${name}|${expiresAt}`);
  }

  async verifyStreamSignature(name: string, expiresAt: number, signature: string): Promise<void> {
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      throw new AppError("STREAM_URL_EXPIRED", "Stream URL has expired", 401);
    }
    const expected = await this.createStreamSignature(name, expiresAt);
    if (!timingSafeEqual(signature, expected)) {
      throw new AppError("INVALID_STREAM_SIGNATURE", "Invalid stream URL", 401);
    }
  }

  private async createToken(username: string): Promise<string> {
    const ts = Date.now().toString();
    const payload = `${username}|${ts}`;
    const sig = await hmacSign(this.env.AUTH_SECRET, payload);
    return btoa(`${payload}|${sig}`);
  }

  private async hashPassword(password: string, username: string): Promise<string> {
    return sha256(`${username.toLowerCase()}:${password}:${CONFIG.passwordHashPepper}`);
  }

  private authResult(username: string, token: string): AuthResult {
    return { token, username, isAdmin: this.isAdmin(username) };
  }

  private isAdmin(username: string): boolean {
    return username.toLowerCase() === CONFIG.adminUsername;
  }
}
