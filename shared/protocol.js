export const DEFAULT_WORKSPACE_ID = "workspace-demo";
export const ROOM_PARTICIPANT_LIMIT = 10;

export const COLLAB_WS_PATH = "/ws/collab";
export const AUTH_COOKIE_NAME = "live_collab_session";
export const JWT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const WS_MESSAGE_TYPES = {
  ROOM_JOIN: "room:join",
  ROOM_JOINED: "room:joined",
  ROOM_PRESENCE: "room:presence",
  ROOM_LEAVE: "room:leave",
  YDOC_SYNC: "ydoc:sync",
  YDOC_UPDATE: "ydoc:update",
  WEBRTC_SIGNAL: "webrtc:signal",
  DOCUMENT_RESTORED: "document:restored",
  ERROR: "system:error",
};

export const PRESENCE_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};
