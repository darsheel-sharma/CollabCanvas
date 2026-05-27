import { SFU_PROVIDERS } from "@live-collab/shared";

export function registerSfuRoutes(app) {
  app.get("/api/sfu/config", (request, response) => {
    response.json({
      provider: process.env.SFU_PROVIDER ?? SFU_PROVIDERS.DISABLED,
      url: process.env.SFU_URL ?? "",
      apiKey: process.env.SFU_API_KEY ?? "",
      enabled:
        Boolean(process.env.SFU_URL) &&
        (process.env.SFU_PROVIDER === SFU_PROVIDERS.LIVEKIT ||
          process.env.SFU_PROVIDER === SFU_PROVIDERS.MEDIASOUP),
      user: request.authUser,
    });
  });

  app.post("/api/sfu/token", (request, response) => {
    response.status(501).json({
      error:
        "SFU token issuance is scaffolded only. Configure LiveKit or Mediasoup credentials to enable this endpoint.",
    });
  });
}
