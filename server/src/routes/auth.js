import { clearSession, getUserFromToken, loginUser, signupUser } from "../lib/auth.js";

function getBearerToken(request) {
  const header = request.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export function registerAuthRoutes(app) {
  app.post("/api/auth/signup", async (request, response) => {
    try {
      const { name, email, password } = request.body ?? {};

      if (!name?.trim() || !email?.trim() || !password?.trim()) {
        response.status(400).json({
          error: "Name, email, and password are required.",
        });
        return;
      }

      if (password.trim().length < 6) {
        response.status(400).json({
          error: "Password must be at least 6 characters.",
        });
        return;
      }

      const result = await signupUser({
        displayName: name,
        email,
        password,
      });

      response.status(201).json(result);
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (request, response) => {
    try {
      const { email, password } = request.body ?? {};

      if (!email?.trim() || !password?.trim()) {
        response.status(400).json({
          error: "Email and password are required.",
        });
        return;
      }

      const result = await loginUser({ email, password });
      response.json(result);
    } catch (error) {
      response.status(401).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", async (request, response) => {
    const token = getBearerToken(request);
    const user = await getUserFromToken(token);

    if (!user) {
      response.status(401).json({ error: "Session expired or invalid." });
      return;
    }

    response.json({ user });
  });

  app.post("/api/auth/logout", (request, response) => {
    clearSession(getBearerToken(request));
    response.status(204).end();
  });
}
