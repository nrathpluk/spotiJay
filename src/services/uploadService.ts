import type { RequestContext } from "../types/context";
import { AppError } from "../utils/errors";
import { assertAudioFile, sanitizeFileName } from "../utils/validation";
import { MusicRepository } from "../repositories/musicRepository";

export class UploadService {
  private readonly music: MusicRepository;

  constructor(context: RequestContext) {
    this.music = new MusicRepository(context.env);
  }

  async upload(request: Request): Promise<{ name: string }> {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("FILE_REQUIRED", "No file provided", 400);
    }

    const name = sanitizeFileName(file.name);
    assertAudioFile(file, name);
    await this.music.put(name, file.stream());
    return { name };
  }

  async delete(name: string): Promise<{ name: string }> {
    const sanitizedName = sanitizeFileName(name);
    await this.music.delete(sanitizedName);
    return { name: sanitizedName };
  }
}
