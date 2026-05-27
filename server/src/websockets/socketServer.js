import { URL } from "node:url";
import { WebSocketServer } from "ws";
import {
  COLLAB_WS_PATH,
  SIGNAL_WS_PATH,
  WS_MESSAGE_TYPES,
} from "@live-collab/shared";
import { getUserFromRequest } from "../lib/auth.js";
import { decodeMessage, encodeMessage } from "../lib/wsCodec.js";

function rejectUpgrade(socket) {
  socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
  socket.destroy();
}

function sendError(socket, message) {
  socket.send(
    encodeMessage({
      type: WS_MESSAGE_TYPES.ERROR,
      payload: { message },
    }),
  );
}

export function createWebSocketServer({ httpServer, roomHub, redisPubSub }) {
  const collabServer = new WebSocketServer({ noServer: true });
  const signalServer = new WebSocketServer({ noServer: true });

  collabServer.on("connection", (socket, request) => {
    const user = request.authUser;
    let activeRoomId = null;
    let activePeerId = null;

    socket.on("message", async (rawData) => {
      try {
        const message = decodeMessage(rawData);
        const { type, payload = {} } = message;

        if (type === WS_MESSAGE_TYPES.ROOM_JOIN) {
          const joinResult = await roomHub.joinRoom(
            payload.roomId,
            payload.peerId,
            socket,
            user,
          );

          if (!joinResult.ok) {
            sendError(socket, joinResult.reason);
            return;
          }

          activeRoomId = payload.roomId;
          activePeerId = payload.peerId;

          socket.send(
            encodeMessage({
              type: WS_MESSAGE_TYPES.ROOM_JOINED,
              payload: {
                roomId: activeRoomId,
                peerId: activePeerId,
                participantLimit: joinResult.room.maxParticipants,
                documentUpdate: joinResult.documentUpdate,
                participants: joinResult.participants,
              },
            }),
          );

          const presenceMessage = encodeMessage({
            type: WS_MESSAGE_TYPES.ROOM_PRESENCE,
            payload: {
              roomId: activeRoomId,
              participants: roomHub.getParticipants(activeRoomId),
            },
          });

          roomHub.broadcast(activeRoomId, presenceMessage);

          await redisPubSub.publish({
            roomId: activeRoomId,
            type: "presence:join",
            payload: {
              peerId: activePeerId,
              userId: user.id,
              displayName: user.name,
              email: user.email,
              joinedAt: new Date().toISOString(),
              source: redisPubSub.instanceId,
            },
          });

          return;
        }

        if (!activeRoomId || !activePeerId) {
          sendError(socket, "Join a room before sending messages.");
          return;
        }

        if (type === WS_MESSAGE_TYPES.YDOC_UPDATE) {
          const update = payload.update instanceof Uint8Array
            ? payload.update
            : Uint8Array.from(payload.update ?? []);

          roomHub.applyYjsUpdate(activeRoomId, update);

          const outboundMessage = encodeMessage({
            type: WS_MESSAGE_TYPES.YDOC_UPDATE,
            payload: {
              roomId: activeRoomId,
              update,
            },
          });

          roomHub.broadcast(activeRoomId, outboundMessage, activePeerId);

          await redisPubSub.publish({
            roomId: activeRoomId,
            type: "ydoc:update",
            payload: {
              peerId: activePeerId,
              userId: user.id,
              update: [...update],
            },
          });

          return;
        }

        if (type === WS_MESSAGE_TYPES.ROOM_LEAVE) {
          roomHub.leaveRoom(activeRoomId, activePeerId);

          const presenceMessage = encodeMessage({
            type: WS_MESSAGE_TYPES.ROOM_PRESENCE,
            payload: {
              roomId: activeRoomId,
              participants: roomHub.getParticipants(activeRoomId),
            },
          });

          roomHub.broadcast(activeRoomId, presenceMessage);
          await redisPubSub.publish({
            roomId: activeRoomId,
            type: "presence:leave",
            payload: { peerId: activePeerId },
          });
        }
      } catch (error) {
        sendError(socket, error.message);
      }
    });

    socket.on("close", async () => {
      if (!activeRoomId || !activePeerId) {
        return;
      }

      roomHub.leaveRoom(activeRoomId, activePeerId);
      const presenceMessage = encodeMessage({
        type: WS_MESSAGE_TYPES.ROOM_PRESENCE,
        payload: {
          roomId: activeRoomId,
          participants: roomHub.getParticipants(activeRoomId),
        },
      });

      roomHub.broadcast(activeRoomId, presenceMessage);
      await redisPubSub.publish({
        roomId: activeRoomId,
        type: "presence:leave",
        payload: { peerId: activePeerId },
      });
    });
  });

  signalServer.on("connection", (socket, request) => {
    socket.send(
      encodeMessage({
        type: WS_MESSAGE_TYPES.SFU_CONFIG,
        payload: {
          user: request.authUser,
          provider: process.env.SFU_PROVIDER ?? "disabled",
          url: process.env.SFU_URL ?? "",
        },
      }),
    );

    socket.on("message", (rawData) => {
      try {
        const message = decodeMessage(rawData);
        if (message.type !== WS_MESSAGE_TYPES.SFU_SIGNAL) {
          sendError(socket, "Unsupported signaling message.");
        }
      } catch (error) {
        sendError(socket, error.message);
      }
    });
  });

  httpServer.on("upgrade", async (request, socket, head) => {
    try {
      const requestUrl = new URL(request.url, "http://localhost");
      const user = await getUserFromRequest(request);

      if (!user) {
        rejectUpgrade(socket);
        return;
      }

      request.authUser = user;

      if (requestUrl.pathname === COLLAB_WS_PATH) {
        collabServer.handleUpgrade(request, socket, head, (ws) => {
          collabServer.emit("connection", ws, request);
        });
        return;
      }

      if (requestUrl.pathname === SIGNAL_WS_PATH) {
        signalServer.handleUpgrade(request, socket, head, (ws) => {
          signalServer.emit("connection", ws, request);
        });
        return;
      }

      socket.destroy();
    } catch {
      rejectUpgrade(socket);
    }
  });

  redisPubSub.subscribe((event) => roomHub.handleRedisEvent(event, encodeMessage));

  return { collabServer, signalServer };
}
