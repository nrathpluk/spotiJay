import { CONFIG } from "../config/constants";
import { AppError } from "./errors";

export interface CredentialsInput {
  username: string;
  password: string;
}

export function validateCredentials(input: Record<string, unknown>): CredentialsInput {
  const username = typeof input.username === "string" ? input.username.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!username || !password) {
    throw new AppError("VALIDATION_ERROR", "Username and password required", 400);
  }
  if (
    username.length < CONFIG.minUsernameLength ||
    username.length > CONFIG.maxUsernameLength
  ) {
    throw new AppError("VALIDATION_ERROR", "Username must be 3-32 characters", 400);
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new AppError("VALIDATION_ERROR", "Username: letters, numbers, underscore only", 400);
  }
  if (password.length < CONFIG.minPasswordLength) {
    throw new AppError("VALIDATION_ERROR", "Password must be at least 6 characters", 400);
  }

  return { username, password };
}

export function sanitizeFileName(name: string): string {
  const lastSegment = name.split(/[\\/]/).pop() ?? "";
  const normalized = lastSegment.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "");
  const sanitized = normalized.replace(/[^a-zA-Z0-9._ -]/g, "_").trim();
  if (!sanitized || sanitized === "." || sanitized === "..") {
    throw new AppError("INVALID_FILE_NAME", "Invalid file name", 400);
  }
  if (sanitized.length > CONFIG.maxFileNameLength) {
    throw new AppError("INVALID_FILE_NAME", "File name is too long", 400);
  }
  return sanitized;
}

export function assertAudioFile(file: File, sanitizedName: string): void {
  const lower = sanitizedName.toLowerCase();
  const extensionOk = CONFIG.allowedAudioExtensions.some((ext) => lower.endsWith(ext));
  const mimeOk =
    CONFIG.allowedAudioMimeTypes.some((mime) => mime === file.type) ||
    file.type.startsWith("audio/");

  if (!extensionOk || !mimeOk) {
    throw new AppError("UNSUPPORTED_MEDIA_TYPE", "Unsupported audio file type", 415);
  }
}
