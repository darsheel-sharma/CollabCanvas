import { create } from "zustand";
import { AUTH_STORAGE_KEY } from "@live-collab/shared";
import { login, logout, me, signup } from "../lib/api.js";

const NODE_DEFAULTS = {
  codeNode: {
    width: 360,
    label: "Code Node",
    code: "function solve() {\n  return 'start coding here';\n}",
  },
  whiteboardNode: {
    width: 320,
    label: "Whiteboard",
    content: "",
  },
  imageNode: {
    width: 300,
    label: "Image Node",
    imageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
  },
};

function createNode(type, index, position = { x: 220, y: 80 }) {
  const id = `${type}-${Date.now()}-${index}`;
  const baseX = position.x + (index % 2) * 24;
  const baseY = position.y + (index % 2) * 24;

  if (type === "codeNode") {
    return {
      id,
      type,
      position: { x: baseX, y: baseY },
      data: {
        label: NODE_DEFAULTS.codeNode.label,
        docKey: `${id}:doc`,
        code: NODE_DEFAULTS.codeNode.code,
      },
      style: { width: NODE_DEFAULTS.codeNode.width },
    };
  }

  if (type === "whiteboardNode") {
    return {
      id,
      type,
      position: { x: baseX, y: baseY },
      data: {
        label: NODE_DEFAULTS.whiteboardNode.label,
        whiteboardKey: `${id}:board`,
        content: NODE_DEFAULTS.whiteboardNode.content,
      },
      style: { width: NODE_DEFAULTS.whiteboardNode.width },
    };
  }

  return {
    id,
    type,
    position: { x: baseX, y: baseY },
    data: {
      label: NODE_DEFAULTS.imageNode.label,
      imageKey: `${id}:image`,
      imageUrl: NODE_DEFAULTS.imageNode.imageUrl,
    },
    style: { width: NODE_DEFAULTS.imageNode.width },
  };
}

function readRoomFromUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  const roomId = new URL(window.location.href).searchParams.get("room");
  return roomId
    ? { roomId, joined: false, shareUrl: window.location.href }
    : null;
}

function parseRoomId(draft) {
  if (!draft) {
    return null;
  }

  if (draft.includes("room=")) {
    try {
      return new URL(draft).searchParams.get("room");
    } catch {
      return null;
    }
  }

  return draft;
}

export const useWorkspaceStore = create((set, get) => ({
  user: null,
  authMode: "login",
  authStatus: "idle",
  authError: "",
  activeRoom: readRoomFromUrl(),
  roomDraft: readRoomFromUrl()?.roomId ?? "",
  roomError: "",
  collabStatus: "idle",
  isMuted: false,
  hasAudioPermission: false,
  viewportCenter: { x: 220, y: 80 },
  nodes: [],
  edges: [],
  canvasVersion: 0,
  isApplyingRemoteState: false,
  setAuthMode: (authMode) => set({ authMode }),
  hydrateSession: async () => {
    const token = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
      return;
    }

    set({ authStatus: "loading", authError: "" });

    try {
      const payload = await me();
      set({
        user: payload.user,
        authStatus: "authenticated",
        authError: "",
      });
    } catch (error) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      set({
        user: null,
        authStatus: "idle",
        authError: "",
      });
    }
  },
  submitAuth: async ({ mode, name, email, password }) => {
    set({ authStatus: "loading", authError: "" });

    try {
      const payload =
        mode === "signup"
          ? await signup({ name, email, password })
          : await login({ email, password });

      sessionStorage.setItem(AUTH_STORAGE_KEY, payload.token);
      set({
        user: payload.user,
        authStatus: "authenticated",
        authError: "",
      });
    } catch (error) {
      set({
        authStatus: "idle",
        authError: error.message,
      });
    }
  },
  logout: async () => {
    try {
      await logout();
    } catch {
      // Keep local logout resilient even if the server is unavailable.
    }

    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    set({
      user: null,
      authStatus: "idle",
      authError: "",
      activeRoom: null,
      roomDraft: "",
      roomError: "",
      nodes: [],
      edges: [],
      isMuted: false,
      hasAudioPermission: false,
    });
  },
  syncRoomFromUrl: () => {
    const room = readRoomFromUrl();
    if (!room) {
      return;
    }

    set({
      activeRoom: room,
      roomDraft: room.roomId,
    });
  },
  setRoomDraft: (roomDraft) => set({ roomDraft, roomError: "" }),
  createRoom: () => {
    const roomId = `meet-${Math.random().toString(36).slice(2, 8)}`;
    const shareUrl = `${window.location.origin}/?room=${roomId}`;
    window.history.replaceState({}, "", `/?room=${roomId}`);

    set({
      activeRoom: { roomId, shareUrl, joined: true },
      roomDraft: roomId,
      roomError: "",
      nodes: [],
      edges: [],
    });
  },
  joinRoom: () => {
    const draft = get().roomDraft.trim();

    if (!draft) {
      set({ roomError: "Enter a room code or meeting link first." });
      return;
    }

    const roomId = parseRoomId(draft);

    if (!roomId) {
      set({ roomError: "That meeting link does not look valid." });
      return;
    }

    const shareUrl = `${window.location.origin}/?room=${roomId}`;
    window.history.replaceState({}, "", `/?room=${roomId}`);

    set({
      activeRoom: { roomId, shareUrl, joined: true },
      roomDraft: roomId,
      roomError: "",
      nodes: [],
      edges: [],
    });
  },
  leaveRoom: () => {
    window.history.replaceState({}, "", "/");
    set({
      activeRoom: null,
      roomDraft: "",
      roomError: "",
      nodes: [],
      edges: [],
      collabStatus: "idle",
      isMuted: false,
      hasAudioPermission: false,
    });
  },
  setRoomError: (roomError) => set({ roomError }),
  failRoomJoin: (roomError) =>
    set((state) => ({
      roomError,
      activeRoom: state.activeRoom
        ? { ...state.activeRoom, joined: false }
        : null,
    })),
  setCollabStatus: (collabStatus) => set({ collabStatus }),
  setAudioPermission: (hasAudioPermission) => set({ hasAudioPermission }),
  setViewportCenter: (viewportCenter) => set({ viewportCenter }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setNodes: (nodes) =>
    set((state) => ({
      nodes,
      canvasVersion: state.canvasVersion + 1,
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges,
      canvasVersion: state.canvasVersion + 1,
    })),

  applyRemoteCanvasState: ({ nodes, edges }) => {
    set({
      nodes: Array.isArray(nodes) ? nodes : [],
      edges: Array.isArray(edges) ? edges : [],
      isApplyingRemoteState: true,
    });

    // Give React Flow a brief window to reconcile remote controlled-node updates.
    setTimeout(() => {
      set({ isApplyingRemoteState: false });
    }, 150);
  },

  clearRemoteApplyFlag: () => set({ isApplyingRemoteState: false }),
  addNode: (type) =>
    set((state) => ({
      nodes: [
        ...state.nodes,
        createNode(type, state.nodes.length + 1, state.viewportCenter),
      ],
      canvasVersion: state.canvasVersion + 1,
    })),
  updateCodeContent: (code, docKey) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.data.docKey === docKey
          ? { ...node, data: { ...node.data, code } }
          : node,
      ),
      canvasVersion: state.canvasVersion + 1,
    })),
  updateWhiteboardContent: (content, whiteboardKey) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.data.whiteboardKey === whiteboardKey
          ? { ...node, data: { ...node.data, content } }
          : node,
      ),
      canvasVersion: state.canvasVersion + 1,
    })),
  updateImageUrl: (imageUrl, imageKey) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.data.imageKey === imageKey
          ? { ...node, data: { ...node.data, imageUrl } }
          : node,
      ),
      canvasVersion: state.canvasVersion + 1,
    })),
}));
