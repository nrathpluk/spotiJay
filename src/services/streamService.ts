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

    const range = parseRangeHeader(this.context.request.headers.get("Range"));
    const object = await this.music.get(name, range.r2Range);
    if (!object) throw new AppError("SONG_NOT_FOUND", "Song not found", 404);

    const headers = new Headers(securityHeaders(CONFIG.audioCacheControl));
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", object.httpMetadata?.contentType ?? "audio/mpeg");
    headers.set("ETag", object.httpEtag);
    headers.set("Accept-Ranges", "bytes");
    const responseRange = resolveResponseRange(range, object.size);
    if (responseRange) {
      headers.set("Content-Range", formatContentRange(responseRange, object.size));
      headers.set("Content-Length", String(responseRange.length));
      return new Response(object.body, { status: 206, headers });
    }

    return new Response(object.body, { headers });
  }
}

interface ParsedRange {
  r2Range?: R2Range;
  start?: number;
  end?: number;
  suffix?: number;
}

function parseRangeHeader(value: string | null): ParsedRange {
  if (!value) return {};
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match) return {};
  const startRaw = match[1] ?? "";
  const endRaw = match[2] ?? "";

  if (startRaw === "" && endRaw === "") return {};

  if (startRaw === "") {
    const suffix = Number.parseInt(endRaw, 10);
    if (!Number.isFinite(suffix) || suffix <= 0) return {};
    return { r2Range: { suffix }, suffix };
  }

  const start = Number.parseInt(startRaw, 10);
  if (!Number.isFinite(start) || start < 0) return {};

  if (endRaw === "") {
    return { r2Range: { offset: start }, start };
  }

  const end = Number.parseInt(endRaw, 10);
  if (!Number.isFinite(end) || end < start) return {};

  return {
    r2Range: { offset: start, length: end - start + 1 },
    start,
    end,
  };
}

function resolveResponseRange(
  range: ParsedRange,
  totalSize: number
): { start: number; end: number; length: number } | null {
  if (!range.r2Range || totalSize <= 0) return null;

  if (typeof range.suffix === "number") {
    const length = Math.min(range.suffix, totalSize);
    return { start: totalSize - length, end: totalSize - 1, length };
  }

  if (typeof range.start !== "number") return null;
  const start = Math.min(range.start, totalSize - 1);
  const end = Math.min(range.end ?? totalSize - 1, totalSize - 1);
  return { start, end, length: end - start + 1 };
}

function formatContentRange(
  range: { start: number; end: number },
  totalSize: number
): string {
  return `bytes ${range.start}-${range.end}/${totalSize}`;
}
