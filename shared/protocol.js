/**
 * Shared constants and protocol definitions used across the client and server.
 * This ensures consistency in WebSocket message types and configuration limits.
 */

// Default room identifier if none is provided
export const DEFAULT_WORKSPACE_ID = "workspace-demo";

// Maximum number of participants allowed in a single WebRTC room
export const ROOM_PARTICIPANT_LIMIT = 10;

// The WebSocket endpoint for collaboration
export const COLLAB_WS_PATH = "/ws/collab";

// Cookie name used for JWT session authentication
export const AUTH_COOKIE_NAME = "live_collab_session";

// Expiration time for JWT sessions (7 days)
export const JWT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Standardized WebSocket message types for the custom binary/JSON protocol.
 * Used for routing messages appropriately on both client and server.
 */
export const WS_MESSAGE_TYPES = {
  ROOM_JOIN: "room:join",           // Client requests to join a workspace
  ROOM_JOINED: "room:joined",       // Server acknowledges successful join
  ROOM_PRESENCE: "room:presence",   // Broadcasts participant enter/leave events
  ROOM_LEAVE: "room:leave",         // Client requests to leave a workspace
  YDOC_SYNC: "ydoc:sync",           // Initial full Yjs document state synchronization
  YDOC_UPDATE: "ydoc:update",       // Incremental Yjs CRDT delta updates
  WEBRTC_SIGNAL: "webrtc:signal",   // SDP offers/answers and ICE candidates for WebRTC
  DOCUMENT_RESTORED: "document:restored", // Indicates document was loaded from DB
  ERROR: "system:error",            // System-level errors (auth, capacity, etc.)
};

/**
 * Defines the connection states of a participant in the workspace.
 */
export const PRESENCE_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};
