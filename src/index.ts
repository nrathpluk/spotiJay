import { validateEnv } from "./config/env";
import { handleError } from "./middleware/errorHandler";
import { optionsResponse, withCors } from "./middleware/cors";
import { rateLimit } from "./middleware/rateLimit";
import { matchRoute } from "./routes";
import type { Env } from "./types/env";
import type { RequestContext } from "./types/context";
import { AppError } from "./utils/errors";
import { createLogger } from "./utils/logger";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();
    const logger = createLogger(requestId);
    const start = Date.now();

    try {
      const runtime = validateEnv(env);
      if (request.method === "OPTIONS") {
        return optionsResponse(request, runtime.corsOrigins);
      }

      const url = new URL(request.url);
      const context: RequestContext = { request, env, requestId, url };
      logger.info("Request received", { method: request.method, path: url.pathname });

      await rateLimit(context, runtime.rateLimitPerMinute);

      const matched = matchRoute(request.method, url.pathname);
      if (!matched) throw new AppError("NOT_FOUND", "Not Found", 404);

      const response = await matched.route.handler(context, matched.match);
      logger.info("Request completed", {
        method: request.method,
        path: url.pathname,
        status: response.status,
        durationMs: Date.now() - start,
      });

      return withCors(response, request, runtime.corsOrigins);
    } catch (error) {
      const runtime = validateEnv(env);
      return withCors(handleError(error, logger), request, runtime.corsOrigins);
    }
  },
};
