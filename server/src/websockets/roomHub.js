import { ROOM_PARTICIPANT_LIMIT } from "@live-collab/shared";

export function createRoomHub() {
  const rooms = new Map();

  function getRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Map(),
        lastDocumentSnapshot: {
          nodes: [],
          edges: [],
        },
        maxParticipants: ROOM_PARTICIPANT_LIMIT,
      });
    }

    return rooms.get(roomId);
  }

  return {
    joinRoom(roomId, peerId, socket, metadata = {}) {
      const room = getRoom(roomId);

      if (!room.participants.has(peerId) && room.participants.size >= room.maxParticipants) {
        return {
          ok: false,
          reason: `Room is full. Only ${room.maxParticipants} participants can join this meeting.`,
        };
      }

      room.participants.set(peerId, {
        peerId,
        socket,
        displayName: metadata.displayName ?? "Guest",
        email: metadata.email ?? "",
        joinedAt: new Date().toISOString(),
      });

      return { ok: true, room };
    },
    leaveRoom(roomId, peerId) {
      const room = rooms.get(roomId);

      if (!room) {
        return null;
      }

      room.participants.delete(peerId);

      if (room.participants.size === 0) {
        rooms.delete(roomId);
        return null;
      }

      return room;
    },
    getParticipants(roomId) {
      const room = rooms.get(roomId);
      return room
        ? [...room.participants.values()].map(({ socket, ...participant }) => participant)
        : [];
    },
    setDocumentSnapshot(roomId, snapshot) {
      const room = getRoom(roomId);
      room.lastDocumentSnapshot = snapshot;
    },
    getDocumentSnapshot(roomId) {
      return rooms.get(roomId)?.lastDocumentSnapshot ?? null;
    },
    broadcast(roomId, message, excludePeerId) {
      const room = rooms.get(roomId);

      if (!room) {
        return;
      }

      for (const participant of room.participants.values()) {
        if (participant.peerId === excludePeerId) {
          continue;
        }

        participant.socket.send(JSON.stringify(message));
      }
    },
  };
}
