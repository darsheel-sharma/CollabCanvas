import {
  PRESENCE_STATUS,
  WS_MESSAGE_TYPES,
} from "@live-collab/shared";

export class WebSocketCollabClient {
  constructor({
    roomId,
    url,
    user,
    onPresence,
    onStatusChange,
    onError,
    onSnapshot,
  }) {
    this.roomId = roomId;
    this.url = url;
    this.user = user;
    this.onPresence = onPresence;
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    this.onSnapshot = onSnapshot;
    this.socket = null;
    this.clientId = globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}`;
  }

  connect() {
    this.onStatusChange?.(PRESENCE_STATUS.CONNECTING);
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", () => {
      this.onStatusChange?.(PRESENCE_STATUS.CONNECTED);
      this.send(WS_MESSAGE_TYPES.ROOM_JOIN, {
        roomId: this.roomId,
        peerId: this.clientId,
        displayName: this.user?.name ?? "Guest",
        email: this.user?.email ?? "",
      });
    });

    this.socket.addEventListener("close", () => {
      this.onStatusChange?.(PRESENCE_STATUS.DISCONNECTED);
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.type === WS_MESSAGE_TYPES.ROOM_PRESENCE) {
        this.onPresence?.(message.payload.participants ?? []);
        return;
      }

      if (message.type === WS_MESSAGE_TYPES.ROOM_JOINED) {
        this.onSnapshot?.(message.payload.snapshot ?? { nodes: [], edges: [] });
        return;
      }

      if (message.type === WS_MESSAGE_TYPES.COLLAB_UPDATE) {
        this.onSnapshot?.(message.payload.update ?? { nodes: [], edges: [] });
        return;
      }

      if (message.type === WS_MESSAGE_TYPES.ERROR) {
        this.onError?.(message.payload.message ?? "Connection error");
      }
    });
  }

  send(type, payload) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify({ type, payload }));
  }

  disconnect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send(WS_MESSAGE_TYPES.ROOM_LEAVE, {
        roomId: this.roomId,
        peerId: this.clientId,
      });
    }

    this.socket?.close();
  }

  sendSnapshot(update) {
    this.send(WS_MESSAGE_TYPES.COLLAB_UPDATE, { update });
  }
}
