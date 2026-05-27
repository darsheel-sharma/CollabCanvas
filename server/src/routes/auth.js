import {
  clearSessionCookie,
  createSessionCookie,
  loginUser,
  signupUser,
} from "../lib/auth.js";

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

      response.setHeader("Set-Cookie", createSessionCookie(result.token));
      response.status(201).json({ user: result.user });
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
      response.setHeader("Set-Cookie", createSessionCookie(result.token));
      response.json({ user: result.user });
    } catch (error) {
      response.status(401).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", (request, response) => {
    if (!request.authUser) {
      response.status(401).json({ error: "Session expired or invalid." });
      return;
    }

    response.json({ user: request.authUser });
  });

  app.post("/api/auth/logout", (_request, response) => {
    response.setHeader("Set-Cookie", clearSessionCookie());
    response.status(204).end();
  });
}
