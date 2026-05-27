import { create } from "zustand";
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

function buildMeetingShareUrl(roomId) {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/meeting?room=${roomId}`;
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
  isSessionHydrated: false,
  authMode: "login",
  authStatus: "idle",
  authError: "",
  activeRoom: null,
  roomDraft: "",
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
    set({ authStatus: "loading", authError: "" });

    try {
      const payload = await me();
      set({
        user: payload.user,
        isSessionHydrated: true,
        authStatus: "authenticated",
        authError: "",
      });
    } catch {
      set({
        user: null,
        isSessionHydrated: true,
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

      set({
        user: payload.user,
        authStatus: "authenticated",
        authError: "",
      });
      return payload.user;
    } catch (error) {
      set({
        authStatus: "idle",
        authError: error.message,
      });
      return null;
    }
  },
  logout: async () => {
    try {
      await logout();
    } catch {
      // Keep local logout resilient even if the server is unavailable.
    }

    set({
      user: null,
      isSessionHydrated: true,
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
  syncRoomFromRoute: (roomId, joined = false) =>
    set({
      activeRoom: roomId
        ? {
            roomId,
            joined,
            shareUrl: buildMeetingShareUrl(roomId),
          }
        : null,
      roomDraft: roomId ?? "",
      roomError: "",
    }),
  setRoomDraft: (roomDraft) => set({ roomDraft, roomError: "" }),
  createRoom: () => {
    const roomId = `meet-${Math.random().toString(36).slice(2, 8)}`;

    set({
      activeRoom: {
        roomId,
        joined: true,
        shareUrl: buildMeetingShareUrl(roomId),
      },
      roomDraft: roomId,
      roomError: "",
      nodes: [],
      edges: [],
    });

    return roomId;
  },
  joinRoom: () => {
    const draft = get().roomDraft.trim();

    if (!draft) {
      set({ roomError: "Enter a room code or meeting link first." });
      return null;
    }

    const roomId = parseRoomId(draft);

    if (!roomId) {
      set({ roomError: "That meeting link does not look valid." });
      return null;
    }

    set({
      activeRoom: {
        roomId,
        joined: true,
        shareUrl: buildMeetingShareUrl(roomId),
      },
      roomDraft: roomId,
      roomError: "",
      nodes: [],
      edges: [],
    });

    return roomId;
  },
  leaveRoom: () => {
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
