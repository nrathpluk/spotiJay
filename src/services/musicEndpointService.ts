import { CONFIG } from "../config/constants";
import { validateEnv } from "../config/env";
import { requireAdmin } from "../middleware/auth";
import type { RequestContext, RouteMatch } from "../types/context";
import { AppError } from "../utils/errors";
import { jsonResponse, readJsonBody } from "../utils/http";
import { ImportService } from "./importService";
import { PlaylistService } from "./playlistService";
import { StreamService } from "./streamService";
import { UploadService } from "./uploadService";

export async function listSongs(context: RequestContext): Promise<Response> {
  const runtime = validateEnv(context.env);
  const service = new PlaylistService(context, runtime.streamUrlTtlSeconds);
  return jsonResponse(await service.listSongs());
}

export async function upload(context: RequestContext): Promise<Response> {
  await requireAdmin(context);
  const service = new UploadService(context);
  return jsonResponse(await service.upload(context.request));
}

export async function deleteSong(context: RequestContext): Promise<Response> {
  await requireAdmin(context);
  const body = await readJsonBody<Record<string, unknown>>(context.request);
  if (typeof body.name !== "string") {
    throw new AppError("VALIDATION_ERROR", "Song name required", 400);
  }
  const service = new UploadService(context);
  return jsonResponse(await service.delete(body.name));
}

export async function stream(context: RequestContext, match: RouteMatch): Promise<Response> {
  const name = match.params.name;
  if (!name) throw new AppError("SONG_NOT_FOUND", "Song not found", 404);
  const service = new StreamService(context);
  return service.stream(name);
}

export async function importPlaylist(context: RequestContext): Promise<Response> {
  await requireAdmin(context);
  const body = await readJsonBody<Record<string, unknown>>(context.request);
  if (typeof body.url !== "string") {
    throw new AppError("VALIDATION_ERROR", "Playlist URL required", 400);
  }
  const service = new ImportService(context);
  return jsonResponse(await service.importPlaylist(body.url));
}

export const streamPattern = new RegExp(`^${CONFIG.apiPrefix}/stream/(?<name>[^/]+)$`);
