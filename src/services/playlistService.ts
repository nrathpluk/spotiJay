import { CONFIG } from "../config/constants";
import type { Song } from "../types/api";
import type { RequestContext } from "../types/context";
import { sanitizeFileName } from "../utils/validation";
import { AuthService } from "./authService";
import { MusicRepository } from "../repositories/musicRepository";

export class PlaylistService {
  private readonly music: MusicRepository;
  private readonly auth: AuthService;

  constructor(private readonly context: RequestContext, private readonly streamTtlSeconds: number) {
    this.music = new MusicRepository(context.env);
    this.auth = new AuthService(context.env);
  }

  async listSongs(): Promise<Song[]> {
    const objects = await this.music.list();
    const origin = this.context.url.origin;
    return Promise.all(objects.map(async (object) => {
      const name = sanitizeFileName(object.name);
      const expiresAt = Date.now() + this.streamTtlSeconds * 1000;
      const signature = await this.auth.createStreamSignature(name, expiresAt);
      const path = `${CONFIG.apiPrefix}/stream/${encodeURIComponent(name)}`;
      const url = new URL(path, origin);
      url.searchParams.set("exp", String(expiresAt));
      url.searchParams.set("sig", signature);
      return { name, url: url.toString() };
    }));
  }
}
