import type { RequestContext } from "../types/context";
import { AppError } from "../utils/errors";
import { sanitizeFileName } from "../utils/validation";
import { MusicRepository } from "../repositories/musicRepository";

export class ImportService {
  private readonly music: MusicRepository;

  constructor(context: RequestContext) {
    this.music = new MusicRepository(context.env);
  }

  async importPlaylist(urlValue: string): Promise<{ imported: number }> {
    let url: URL;
    try {
      url = new URL(urlValue);
    } catch {
      throw new AppError("INVALID_URL", "Invalid playlist URL", 400);
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new AppError("INVALID_URL", "Playlist URL must be HTTP or HTTPS", 400);
    }

    const playlistRes = await fetch(url.toString());
    if (!playlistRes.ok) {
      throw new AppError("PLAYLIST_FETCH_FAILED", "Unable to fetch playlist", 502);
    }

    const playlistText = await playlistRes.text();
    let imported = 0;

    for (const line of playlistText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) continue;

      const songRes = await fetch(trimmed);
      if (!songRes.ok || !songRes.body) continue;

      const fileName = sanitizeFileName(new URL(trimmed).pathname.split("/").pop() ?? "");
      await this.music.put(fileName, songRes.body);
      imported += 1;
    }

    return { imported };
  }
}
