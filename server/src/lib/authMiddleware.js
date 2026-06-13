import { getUserFromRequest } from "./auth.js";

/**
 * Express middleware that extracts the user from the request and attaches
 * it to the request object. It doesn't block the request if the user is not found.
 */
export async function attachAuthUser(request, _response, next) {
  const user = await getUserFromRequest(request);
  request.authUser = user;
  request.user = user;
  next();
}

/**
 * Express middleware that enforces authentication.
 * Returns a 401 response if no valid user is attached to the request.
 */
export function requireAuth(request, response, next) {
  if (!request.authUser && !request.user) {
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
