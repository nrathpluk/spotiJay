import type { RequestContext } from "../types/context";
import type { SessionUser } from "../types/api";
import { AppError } from "../utils/errors";
import { AuthService } from "../services/authService";

export async function requireUser(context: RequestContext): Promise<SessionUser> {
  const auth = context.request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new AppError("UNAUTHORIZED", "Unauthorized", 401);
  }
  const service = new AuthService(context.env);
  return service.verifyToken(auth.slice(7));
}

export async function requireAdmin(context: RequestContext): Promise<SessionUser> {
  const user = await requireUser(context);
  if (!user.isAdmin) {
    throw new AppError("FORBIDDEN", "Forbidden: Admin Only", 403);
  }
  return user;
}
