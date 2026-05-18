import type { Env } from "./env";

export interface RequestContext {
  request: Request;
  env: Env;
  requestId: string;
  url: URL;
}

export interface RouteMatch {
  params: Record<string, string>;
}

export type RouteHandler = (
  context: RequestContext,
  match: RouteMatch
) => Promise<Response>;

export interface RouteDefinition {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}
