import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebSocketCollabClient } from "../lib/websocketClient.js";
import { DEFAULT_WORKSPACE_ID, PRESENCE_STATUS } from "@live-collab/shared";
import { useWorkspaceStore } from "../store/workspaceStore.js";

const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000";

export function useCollabSession({ enabled, workspaceId = DEFAULT_WORKSPACE_ID, user }) {
  const setCollabStatus = useWorkspaceStore((state) => state.setCollabStatus);
  const failRoomJoin = useWorkspaceStore((state) => state.failRoomJoin);
  const applyRemoteCanvasState = useWorkspaceStore((state) => state.applyRemoteCanvasState);
  const lastSentSnapshotRef = useRef("");
  const lastSentVersionRef = useRef(0);
  const pendingSendRef = useRef(null);
  const [sessionState, setSessionState] = useState({
    status: PRESENCE_STATUS.DISCONNECTED,
    participants: [],
    doc: null,
    sharedText: null,
    signalPeer: null,
    client: null,
  });

  useEffect(() => {
    if (!enabled || !user || !workspaceId) {
      setSessionState({
        status: PRESENCE_STATUS.DISCONNECTED,
        participants: [],
        doc: null,
        sharedText: null,
        signalPeer: null,
      });
      return undefined;
    }

    const doc = new Y.Doc();
    const sharedText = doc.getText("workspace:primary-code");
    const client = new WebSocketCollabClient({
      roomId: workspaceId,
      url: wsUrl,
      user,
      onPresence: (participants) => {
        setSessionState((current) => ({ ...current, participants }));
      },
      onStatusChange: (status) => {
        setCollabStatus(status);
        setSessionState((current) => ({ ...current, status }));
      },
      onError: (message) => {
        failRoomJoin(message);
      },
      onSnapshot: (snapshot) => {
        applyRemoteCanvasState(snapshot);
        lastSentSnapshotRef.current = JSON.stringify(snapshot ?? { nodes: [], edges: [] });
        lastSentVersionRef.current = useWorkspaceStore.getState().canvasVersion;
      },
    });

    client.connect();
    setSessionState((current) => ({
      ...current,
      doc,
      sharedText,
      status: PRESENCE_STATUS.CONNECTING,
      client,
    }));

    lastSentVersionRef.current = useWorkspaceStore.getState().canvasVersion;

    const unsubscribe = useWorkspaceStore.subscribe((state) => {
      if (state.canvasVersion === lastSentVersionRef.current) {
        return;
      }

      const snapshot = {
        nodes: state.nodes,
        edges: state.edges,
      };
      const serializedSnapshot = JSON.stringify(snapshot);

      if (state.isApplyingRemoteState) {
        lastSentSnapshotRef.current = serializedSnapshot;
        lastSentVersionRef.current = state.canvasVersion;
        return;
      }

      if (serializedSnapshot === lastSentSnapshotRef.current) {
        lastSentVersionRef.current = state.canvasVersion;
        return;
      }

      lastSentVersionRef.current = state.canvasVersion;

      window.clearTimeout(pendingSendRef.current);
      pendingSendRef.current = window.setTimeout(() => {
        lastSentSnapshotRef.current = serializedSnapshot;
        client.sendSnapshot(snapshot);
      }, 80);
    });

    return () => {
      window.clearTimeout(pendingSendRef.current);
      unsubscribe();
      client.disconnect();
      doc.destroy();
      setSessionState({
        status: PRESENCE_STATUS.DISCONNECTED,
        participants: [],
        doc: null,
        sharedText: null,
        signalPeer: null,
        client: null,
      });
    };
  }, [
    applyRemoteCanvasState,
    enabled,
    failRoomJoin,
    setCollabStatus,
    user,
    workspaceId,
  ]);

  return sessionState;
}
