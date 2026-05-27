import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { DEFAULT_WORKSPACE_ID, PRESENCE_STATUS } from "@live-collab/shared";
import { WebSocketCollabClient } from "../lib/websocketClient.js";
import { useWorkspaceStore } from "../store/workspaceStore.js";

const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000";

function syncCollectionToYMap(yMap, items, codeInitializer) {
  const nextIds = new Set(items.map((item) => item.id));

  yMap.doc.transact(() => {
    for (const [key] of yMap.entries()) {
      if (!nextIds.has(key)) {
        yMap.delete(key);
      }
    }

    for (const item of items) {
      yMap.set(item.id, item);
      codeInitializer?.(item);
    }
  }, "local-canvas");
}

function readCollection(yMap) {
  return [...yMap.values()].sort((left, right) => {
    if (left.position?.y !== right.position?.y) {
      return (left.position?.y ?? 0) - (right.position?.y ?? 0);
    }

    return (left.position?.x ?? 0) - (right.position?.x ?? 0);
  });
}

export function useCollabSession({ enabled, workspaceId = DEFAULT_WORKSPACE_ID, user }) {
  const setCollabStatus = useWorkspaceStore((state) => state.setCollabStatus);
  const failRoomJoin = useWorkspaceStore((state) => state.failRoomJoin);
  const applyRemoteCanvasState = useWorkspaceStore((state) => state.applyRemoteCanvasState);
  const [sessionState, setSessionState] = useState({
    status: PRESENCE_STATUS.DISCONNECTED,
    participants: [],
    doc: null,
    awareness: null,
    client: null,
  });
  const lastCanvasVersionRef = useRef(0);

  useEffect(() => {
    if (!enabled || !user || !workspaceId) {
      setSessionState({
        status: PRESENCE_STATUS.DISCONNECTED,
        participants: [],
        doc: null,
        awareness: null,
        client: null,
      });
      return undefined;
    }

    const doc = new Y.Doc();
    const nodesMap = doc.getMap("canvas:nodes");
    const edgesMap = doc.getMap("canvas:edges");

    const syncCanvasFromDoc = () => {
      applyRemoteCanvasState({
        nodes: readCollection(nodesMap),
        edges: readCollection(edgesMap),
      });
      lastCanvasVersionRef.current = useWorkspaceStore.getState().canvasVersion;
    };

    const client = new WebSocketCollabClient({
      roomId: workspaceId,
      url: wsUrl,
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
      onRoomJoined: (payload) => {
        if (payload.documentUpdate) {
          Y.applyUpdate(doc, payload.documentUpdate, "remote");
        }

        setSessionState((current) => ({
          ...current,
          participants: payload.participants ?? current.participants,
        }));
        syncCanvasFromDoc();
      },
      onYDocUpdate: (update) => {
        Y.applyUpdate(doc, update, "remote");
      },
    });

    const handleDocUpdate = (update, origin) => {
      if (origin === "remote") {
        syncCanvasFromDoc();
        return;
      }

      client.sendYDocUpdate(update);
    };

    const handleNodesChange = (_events, transaction) => {
      if (transaction.origin === "remote") {
        syncCanvasFromDoc();
      }
    };

    const handleEdgesChange = (_events, transaction) => {
      if (transaction.origin === "remote") {
        syncCanvasFromDoc();
      }
    };

    doc.on("update", handleDocUpdate);
    nodesMap.observeDeep(handleNodesChange);
    edgesMap.observeDeep(handleEdgesChange);

    client.connect();
    setSessionState({
      status: PRESENCE_STATUS.CONNECTING,
      participants: [],
      doc,
      awareness: null,
      client,
    });

    lastCanvasVersionRef.current = useWorkspaceStore.getState().canvasVersion;

    const unsubscribe = useWorkspaceStore.subscribe((state) => {
      if (state.isApplyingRemoteState || state.canvasVersion === lastCanvasVersionRef.current) {
        return;
      }

      lastCanvasVersionRef.current = state.canvasVersion;

      syncCollectionToYMap(nodesMap, state.nodes, (node) => {
        if (node.type !== "codeNode" || !node.data?.docKey || !node.data?.code) {
          return;
        }

        const yText = doc.getText(node.data.docKey);
        if (yText.length === 0) {
          yText.insert(0, node.data.code);
        }
      });
      syncCollectionToYMap(edgesMap, state.edges);
    });

    return () => {
      unsubscribe();
      nodesMap.unobserveDeep(handleNodesChange);
      edgesMap.unobserveDeep(handleEdgesChange);
      doc.off("update", handleDocUpdate);
      client.disconnect();
      doc.destroy();
      setSessionState({
        status: PRESENCE_STATUS.DISCONNECTED,
        participants: [],
        doc: null,
        awareness: null,
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
