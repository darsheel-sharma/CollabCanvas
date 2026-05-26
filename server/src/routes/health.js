export function registerHealthRoutes(app) {
  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "live-collab-workspace-server",
      timestamp: new Date().toISOString(),
    });
  });
}

