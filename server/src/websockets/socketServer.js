import { WebSocketServer } from "ws";
import { WS_MESSAGE_TYPES } from "@live-collab/shared";

export function createWebSocketServer({ httpServer, roomHub }) {
  const wsServer = new WebSocketServer({ server: httpServer });

  wsServer.on("connection", (socket) => {
    let activeRoomId = null;
    let activePeerId = null;

    socket.on("message", (rawData) => {
      try {
        const message = JSON.parse(rawData.toString());
        const { type, payload = {} } = message;

        if (type === WS_MESSAGE_TYPES.ROOM_JOIN) {
          const requestedRoomId = payload.roomId;
          const requestedPeerId = payload.peerId;
          const joinResult = roomHub.joinRoom(requestedRoomId, requestedPeerId, socket, {
            displayName: payload.displayName,
            email: payload.email,
          });

          if (!joinResult.ok) {
            socket.send(
              JSON.stringify({
                type: WS_MESSAGE_TYPES.ERROR,
                payload: { message: joinResult.reason },
              }),
            );
            return;
          }

          activeRoomId = requestedRoomId;
          activePeerId = requestedPeerId;

          socket.send(
            JSON.stringify({
              type: WS_MESSAGE_TYPES.ROOM_JOINED,
              payload: {
                roomId: activeRoomId,
                peerId: activePeerId,
                snapshot: roomHub.getDocumentSnapshot(activeRoomId),
                participantLimit: 4,
              },
            }),
          );

          roomHub.broadcast(activeRoomId, {
            type: WS_MESSAGE_TYPES.ROOM_PRESENCE,
            payload: {
              roomId: activeRoomId,
              participants: roomHub.getParticipants(activeRoomId),
            },
          });

          return;
        }

        if (!activeRoomId || !activePeerId) {
          socket.send(
            JSON.stringify({
              type: WS_MESSAGE_TYPES.ERROR,
              payload: { message: "Join a room before sending messages." },
            }),
          );
          return;
        }

        if (type === WS_MESSAGE_TYPES.COLLAB_UPDATE) {
          roomHub.setDocumentSnapshot(activeRoomId, payload.update ?? null);
          roomHub.broadcast(activeRoomId, message, activePeerId);
          return;
        }

        if (type === WS_MESSAGE_TYPES.WEBRTC_SIGNAL) {
          roomHub.broadcast(activeRoomId, message, activePeerId);
          return;
        }

        if (type === WS_MESSAGE_TYPES.ROOM_LEAVE) {
          const room = roomHub.leaveRoom(activeRoomId, activePeerId);
          if (room) {
            roomHub.broadcast(activeRoomId, {
              type: WS_MESSAGE_TYPES.ROOM_PRESENCE,
              payload: {
                roomId: activeRoomId,
                participants: roomHub.getParticipants(activeRoomId),
              },
            });
          }
        }
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: WS_MESSAGE_TYPES.ERROR,
            payload: { message: error.message },
          }),
        );
      }
    });

    socket.on("close", () => {
      if (!activeRoomId || !activePeerId) {
        return;
      }

      const room = roomHub.leaveRoom(activeRoomId, activePeerId);
      if (room) {
        roomHub.broadcast(activeRoomId, {
          type: WS_MESSAGE_TYPES.ROOM_PRESENCE,
          payload: {
            roomId: activeRoomId,
            participants: roomHub.getParticipants(activeRoomId),
          },
        });
      }
    });
  });

  return wsServer;
}
