import type { RouteDefinition, RouteMatch } from "../types/context";
import { authRoutes } from "./authRoutes";
import { healthRoutes } from "./healthRoutes";
import { musicRoutes } from "./musicRoutes";

export const routes: RouteDefinition[] = [
  ...healthRoutes,
  ...authRoutes,
  ...musicRoutes,
];

export function matchRoute(method: string, pathname: string): { route: RouteDefinition; match: RouteMatch } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const result = route.pattern.exec(pathname);
    if (!result) continue;
    return {
      route,
      match: {
        params: result.groups ?? {},
      },
    };
  }
  return null;
}
