import type { Env } from "../types/env";

export interface MusicObject {
  name: string;
  size?: number;
  uploaded?: Date;
}

export class MusicRepository {
  constructor(private readonly env: Env) {}

  async list(): Promise<MusicObject[]> {
    const objects = await this.env.MUSIC_BUCKET.list();
    return objects.objects.map((object) => ({
      name: object.key,
      size: object.size,
      uploaded: object.uploaded,
    }));
  }

  async put(name: string, body: ReadableStream): Promise<void> {
    await this.env.MUSIC_BUCKET.put(name, body);
  }

  async get(name: string): Promise<R2ObjectBody | null> {
    return this.env.MUSIC_BUCKET.get(name);
  }

  async delete(name: string): Promise<void> {
    await this.env.MUSIC_BUCKET.delete(name);
  }

  async checkConnectivity(): Promise<boolean> {
    await this.env.MUSIC_BUCKET.list({ limit: 1 });
    return true;
  }
}
