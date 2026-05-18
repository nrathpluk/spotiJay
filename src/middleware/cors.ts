import { CONFIG } from "../config/constants";
import { securityHeaders } from "../utils/http";

export function getCorsHeaders(request: Request, allowedOrigins: string[]): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : "";
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  return headers;
}

export function optionsResponse(request: Request, allowedOrigins: string[]): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...securityHeaders(CONFIG.jsonCacheControl),
      ...getCorsHeaders(request, allowedOrigins),
    },
  });
}

export function withCors(response: Response, request: Request, allowedOrigins: string[]): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request, allowedOrigins);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
