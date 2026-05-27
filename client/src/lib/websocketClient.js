import { COLLAB_WS_PATH, PRESENCE_STATUS, WS_MESSAGE_TYPES } from "@live-collab/shared";
import { decodeMessage, encodeMessage } from "./wsCodec.js";

function normalizeWsUrl(baseUrl, path) {
  const url = new URL(baseUrl);
  url.pathname = path;
  return url.toString();
}

export class WebSocketCollabClient {
  constructor({
    roomId,
    url,
    onPresence,
    onStatusChange,
    onError,
    onRoomJoined,
    onYDocUpdate,
  }) {
    this.roomId = roomId;
    this.url = normalizeWsUrl(url, COLLAB_WS_PATH);
    this.onPresence = onPresence;
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    this.onRoomJoined = onRoomJoined;
    this.onYDocUpdate = onYDocUpdate;
    this.socket = null;
    this.clientId = globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}`;
  }

  connect() {
    this.onStatusChange?.(PRESENCE_STATUS.CONNECTING);
    this.socket = new WebSocket(this.url);
    this.socket.binaryType = "arraybuffer";

    this.socket.addEventListener("open", () => {
      this.onStatusChange?.(PRESENCE_STATUS.CONNECTED);
      this.send(WS_MESSAGE_TYPES.ROOM_JOIN, {
        roomId: this.roomId,
        peerId: this.clientId,
      });
    });

    this.socket.addEventListener("close", () => {
      this.onStatusChange?.(PRESENCE_STATUS.DISCONNECTED);
    });

    this.socket.addEventListener("message", async (event) => {
      const message = await decodeMessage(event.data);

      if (message.type === WS_MESSAGE_TYPES.ROOM_PRESENCE) {
        this.onPresence?.(message.payload.participants ?? []);
        return;
      }

      if (message.type === WS_MESSAGE_TYPES.ROOM_JOINED) {
        this.onRoomJoined?.(message.payload);
        return;
      }

      if (message.type === WS_MESSAGE_TYPES.YDOC_UPDATE) {
        this.onYDocUpdate?.(message.payload.update ?? new Uint8Array());
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

    this.socket.send(encodeMessage({ type, payload }));
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

  sendYDocUpdate(update) {
    this.send(WS_MESSAGE_TYPES.YDOC_UPDATE, { update });
  }
}
