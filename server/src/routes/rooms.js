import { ROOM_PARTICIPANT_LIMIT } from "@live-collab/shared";

function createRoomId() {
  return `meet-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Registers routes for ad-hoc room creation (often used as a fallback if not using full workspaces).
 */
export function registerRoomRoutes(app) {
  app.post("/api/rooms", (_request, response) => {
    const roomId = createRoomId();
    response.status(201).json({
      roomId,
      participantLimit: ROOM_PARTICIPANT_LIMIT,
    });
  });

  app.get("/api/rooms/:roomId", (request, response) => {
    response.json({
      roomId: request.params.roomId,
      participantLimit: ROOM_PARTICIPANT_LIMIT,
      ok: true,
    });
  });
}
