import { SIGNAL_WS_PATH } from "@live-collab/shared";
import { fetchSfuConfig } from "./api.js";
import { decodeMessage, encodeMessage } from "./wsCodec.js";

function normalizeWsUrl(baseUrl, path) {
  const url = new URL(baseUrl);
  url.pathname = path;
  return url.toString();
}

export async function loadSfuConfig() {
  return fetchSfuConfig();
}

export class SfuSignalClient {
  constructor({ url, onConfig, onError }) {
    this.url = normalizeWsUrl(url, SIGNAL_WS_PATH);
    this.onConfig = onConfig;
    this.onError = onError;
    this.socket = null;
  }

  connect() {
    this.socket = new WebSocket(this.url);
    this.socket.binaryType = "arraybuffer";

    this.socket.addEventListener("message", async (event) => {
      const message = await decodeMessage(event.data);

      if (message.type === "sfu:config") {
        this.onConfig?.(message.payload);
        return;
      }

      if (message.type === "system:error") {
        this.onError?.(message.payload.message ?? "SFU signaling error");
      }
    });
  }

  send(payload) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(encodeMessage({ type: "sfu:signal", payload }));
  }

  disconnect() {
    this.socket?.close();
  }
}
