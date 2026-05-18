export interface Env {
  MUSIC_BUCKET: R2Bucket;
  USERS: KVNamespace;
  AUTH_SECRET: string;
  CORS_ORIGINS?: string;
  STREAM_URL_TTL_SECONDS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
}
