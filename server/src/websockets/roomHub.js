import * as Y from "yjs";
import { ROOM_PARTICIPANT_LIMIT } from "@live-collab/shared";
import { prisma } from "../lib/prisma.js";

const DOCUMENT_SAVE_DEBOUNCE_MS = 1500;

async function ensureWorkspaceRecord(roomId, ownerUserId) {
  return prisma.workspace.upsert({
    where: { slug: roomId },
    update: {},
    create: {
      slug: roomId,
      name: `Workspace ${roomId}`,
      ownerId: ownerUserId,
      documentState: {
        create: {},
      },
    },
    include: { documentState: true },
  });
}

export function createRoomHub({ redisPubSub }) {
  const rooms = new Map();

  async function ensureRoom(roomId, ownerUserId) {
    if (rooms.has(roomId)) {
      return rooms.get(roomId);
    }

    const workspace = await ensureWorkspaceRecord(roomId, ownerUserId);
    const ydoc = new Y.Doc();

    if (workspace.documentState?.snapshot) {
      Y.applyUpdate(ydoc, workspace.documentState.snapshot);
    }

    const room = {
      roomId,
      workspaceId: workspace.id,
      participants: new Map(),
      ydoc,
      maxParticipants: ROOM_PARTICIPANT_LIMIT,
      saveTimer: null,
    };

    rooms.set(roomId, room);
    return room;
  }

  function schedulePersist(room) {
    clearTimeout(room.saveTimer);
    room.saveTimer = setTimeout(async () => {
      const snapshot = Buffer.from(Y.encodeStateAsUpdate(room.ydoc));
      const stateVector = Buffer.from(Y.encodeStateVector(room.ydoc));

      try {
        await prisma.documentState.upsert({
          where: { workspaceId: room.workspaceId },
          update: {
            snapshot,
            stateVector,
          },
          create: {
            workspaceId: room.workspaceId,
            snapshot,
            stateVector,
          },
        });
      } catch (error) {
        console.error(`Failed to persist room ${room.roomId}`, error);
      }
    }, DOCUMENT_SAVE_DEBOUNCE_MS);
  }

  function serializeParticipants(room) {
    return [...room.participants.values()]
      .map(({ socket, ...participant }) => participant)
      .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
  }

  function cleanupRoomIfEmpty(roomId) {
    const room = rooms.get(roomId);

    if (!room) {
      return;
    }

    if (room.participants.size === 0) {
      clearTimeout(room.saveTimer);
      rooms.delete(roomId);
    }
  }

  return {
    async joinRoom(roomId, peerId, socket, user) {
      const room = await ensureRoom(roomId, user.id);

      if (!room.participants.has(peerId) && room.participants.size >= room.maxParticipants) {
        return {
          ok: false,
          reason: `Room is full. Only ${room.maxParticipants} participants can join this meeting.`,
        };
      }

      room.participants.set(peerId, {
        peerId,
        socket,
        userId: user.id,
        displayName: user.name,
        email: user.email,
        joinedAt: new Date().toISOString(),
        source: redisPubSub.instanceId,
      });

      return {
        ok: true,
        room,
        participants: serializeParticipants(room),
        documentUpdate: Y.encodeStateAsUpdate(room.ydoc),
      };
    },
    registerRemoteParticipant(roomId, participant) {
      const room = rooms.get(roomId);
      if (!room) {
        return;
      }

      room.participants.set(participant.peerId, {
        ...participant,
        socket: null,
      });
    },
    leaveRoom(roomId, peerId) {
      const room = rooms.get(roomId);

      if (!room) {
        return null;
      }

      room.participants.delete(peerId);
      cleanupRoomIfEmpty(roomId);
      return rooms.get(roomId) ?? null;
    },
    getParticipants(roomId) {
      const room = rooms.get(roomId);
      return room ? serializeParticipants(room) : [];
    },
    applyYjsUpdate(roomId, update) {
      const room = rooms.get(roomId);
      if (!room) {
        return;
      }

      Y.applyUpdate(room.ydoc, update, "remote");
      schedulePersist(room);
    },
    encodeDocumentState(roomId) {
      const room = rooms.get(roomId);
      return room ? Y.encodeStateAsUpdate(room.ydoc) : new Uint8Array();
    },
    broadcast(roomId, encodedMessage, excludePeerId) {
      const room = rooms.get(roomId);

      if (!room) {
        return;
      }

      for (const participant of room.participants.values()) {
        if (!participant.socket || participant.peerId === excludePeerId) {
          continue;
        }

        participant.socket.send(encodedMessage);
      }
    },
    async handleRedisEvent(event, encodeMessage) {
      const { roomId, type, payload } = event;

      if (type === "presence:join") {
        await ensureRoom(roomId, payload.userId);
        this.registerRemoteParticipant(roomId, payload);
        this.broadcast(
          roomId,
          encodeMessage({
            type: "room:presence",
            payload: {
              roomId,
              participants: this.getParticipants(roomId),
            },
          }),
        );
        return;
      }

      if (type === "presence:leave") {
        this.leaveRoom(roomId, payload.peerId);
        this.broadcast(
          roomId,
          encodeMessage({
            type: "room:presence",
            payload: {
              roomId,
              participants: this.getParticipants(roomId),
            },
          }),
        );
        return;
      }

      if (type === "ydoc:update") {
        await ensureRoom(roomId, payload.userId);
        this.applyYjsUpdate(roomId, Uint8Array.from(payload.update));
        this.broadcast(
          roomId,
          encodeMessage({
            type: "ydoc:update",
            payload: { roomId, update: payload.update },
          }),
          payload.peerId,
        );
      }
    },
  };
}
