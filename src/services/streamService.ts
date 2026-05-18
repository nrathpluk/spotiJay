import { CONFIG } from "../config/constants";
import type { RequestContext } from "../types/context";
import { AppError } from "../utils/errors";
import { securityHeaders } from "../utils/http";
import { sanitizeFileName } from "../utils/validation";
import { AuthService } from "./authService";
import { MusicRepository } from "../repositories/musicRepository";

export class StreamService {
  private readonly music: MusicRepository;
  private readonly auth: AuthService;

  constructor(private readonly context: RequestContext) {
    this.music = new MusicRepository(context.env);
    this.auth = new AuthService(context.env);
  }

  async stream(rawName: string): Promise<Response> {
    const name = sanitizeFileName(decodeURIComponent(rawName));
    const expiresAt = Number.parseInt(this.context.url.searchParams.get("exp") ?? "", 10);
    const signature = this.context.url.searchParams.get("sig") ?? "";
    await this.auth.verifyStreamSignature(name, expiresAt, signature);

    const object = await this.music.get(name);
    if (!object) throw new AppError("SONG_NOT_FOUND", "Song not found", 404);

    const headers = new Headers(securityHeaders(CONFIG.audioCacheControl));
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", object.httpMetadata?.contentType ?? "audio/mpeg");
    headers.set("ETag", object.httpEtag);
    headers.set("Accept-Ranges", "bytes");

    return new Response(object.body, { headers });
  }
}
