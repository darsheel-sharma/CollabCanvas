/**
 * Registers a simple health check endpoint used by load balancers and container
 * orchestrators (like Docker/Kubernetes) to verify the process is alive.
 */
export function registerHealthRoutes(app) {
  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "live-collab-workspace-server",
      timestamp: new Date().toISOString(),
    });
  });
}

