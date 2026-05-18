import { CONFIG } from "../config/constants";
import type { ApiFailure, ApiSuccess } from "../types/api";
import { AppError } from "./errors";

export function securityHeaders(cacheControl: string = CONFIG.jsonCacheControl): HeadersInit {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cache-Control": cacheControl,
  };
}

export function jsonResponse<T>(
  data: T,
  init: ResponseInit = {}
): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...securityHeaders(),
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export function errorResponse(error: AppError, init: ResponseInit = {}): Response {
  const body: ApiFailure = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  };

  return new Response(JSON.stringify(body), {
    ...init,
    status: error.status,
    headers: {
      ...securityHeaders(),
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export async function readJsonBody<T extends object>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError("INVALID_JSON", "Request body must be a JSON object", 400);
    }
    return body as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("INVALID_JSON", "Invalid JSON request body", 400);
  }
}
