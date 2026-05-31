import { getUserFromRequest } from "./auth.js";

export async function attachAuthUser(request, _response, next) {
  const user = await getUserFromRequest(request);
  request.authUser = user;
  request.user = user;
  next();
}

export function requireAuth(request, response, next) {
  if (!request.authUser && !request.user) {
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
