import { COLLAB_WS_PATH, PRESENCE_STATUS, WS_MESSAGE_TYPES } from "@live-collab/shared";
import { decodeMessage, encodeMessage } from "./wsCodec.js";

function normalizeWsUrl(baseUrl, path) {
  const url = new URL(baseUrl);
  url.pathname = path;
  return url.toString();
}

/**
 * Client-side manager for the WebSocket collaboration connection.
 * Handles connecting, parsing binary/JSON messages, tracking connection status,
 * and routing incoming events (Yjs syncs, WebRTC signals, presence updates).
 */
export class WebSocketCollabClient {
  constructor({
    roomId,
    url,
    onPresence,
    onStatusChange,
    onError,
    onRoomJoined,
    onYDocUpdate,
    onWebRTCSignal,
  }) {
    this.roomId = roomId;
    this.url = normalizeWsUrl(url, COLLAB_WS_PATH);
    this.onPresence = onPresence;
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    this.onRoomJoined = onRoomJoined;
    this.onYDocUpdate = onYDocUpdate;
    this.onWebRTCSignal = onWebRTCSignal;
    this.socket = null;
    this.clientId = globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}`;
  }

  /**
   * Initiates the WebSocket connection to the server, appending the JWT token
   * if the user is authenticated.
   */
  connect() {
    this.onStatusChange?.(PRESENCE_STATUS.CONNECTING);
    
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    let wsUrl = this.url;
    if (token) {
      try {
        const urlObj = new URL(wsUrl);
        urlObj.searchParams.set("token", token);
        wsUrl = urlObj.toString();
      } catch (err) {
        console.error("Failed to append token to websocket URL:", err);
      }
    }

    this.socket = new WebSocket(wsUrl);
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

      if (message.type === WS_MESSAGE_TYPES.WEBRTC_SIGNAL) {
        let payload = message.payload;
        if (typeof payload.signal === "string") {
          try {
            payload.signal = JSON.parse(payload.signal);
          } catch (e) {
            console.error("Failed to parse WebRTC signal", e);
          }
        }
        this.onWebRTCSignal?.(payload);
        return;
      }

      if (message.type === WS_MESSAGE_TYPES.ERROR) {
        this.onError?.(message.payload.message ?? "Connection error");
      }
    });
  }

  /**
   * Internal helper to encode and dispatch messages over the active socket.
   */
  send(type, payload) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(encodeMessage({ type, payload }));
  }

  /**
   * Gracefully terminates the connection and informs the server.
   */
  disconnect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send(WS_MESSAGE_TYPES.ROOM_LEAVE, {
        roomId: this.roomId,
        peerId: this.clientId,
      });
    }

    this.socket?.close();
  }

  /**
   * Dispatches a binary Yjs CRDT update payload.
   */
  sendYDocUpdate(update) {
    this.send(WS_MESSAGE_TYPES.YDOC_UPDATE, { update });
  }

  sendWebRTCSignal(targetPeerId, signal) {
    this.send(WS_MESSAGE_TYPES.WEBRTC_SIGNAL, {
      targetPeerId,
      signal: JSON.stringify(signal),
    });
  }
}
