export const DEFAULT_WORKSPACE_ID = "workspace-demo";
export const ROOM_PARTICIPANT_LIMIT = 4;

export const WS_MESSAGE_TYPES = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_JOINED: "room:joined",
  ROOM_PRESENCE: "room:presence",
  ROOM_LEAVE: "room:leave",
  COLLAB_UPDATE: "collab:update",
  WEBRTC_SIGNAL: "webrtc:signal",
  DOCUMENT_LOAD: "document:load",
  DOCUMENT_SAVE: "document:save",
  ERROR: "system:error",
};

export const AUTH_STORAGE_KEY = "live-collab-session-token";

export const PRESENCE_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};
