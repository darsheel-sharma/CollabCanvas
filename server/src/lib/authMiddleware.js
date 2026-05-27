import { getUserFromRequest } from "./auth.js";

export async function attachAuthUser(request, _response, next) {
  request.authUser = await getUserFromRequest(request);
  next();
}

export function requireAuth(request, response, next) {
  if (!request.authUser) {
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
