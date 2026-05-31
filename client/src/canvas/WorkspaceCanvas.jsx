import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "reactflow";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CodeNode } from "../components/nodes/CodeNode.jsx";
import { WhiteboardNode } from "../components/nodes/WhiteboardNode.jsx";
import { ImageNode } from "../components/nodes/ImageNode.jsx";
import { useWorkspaceStore } from "../store/workspaceStore.js";

const nodeTypes = {
  codeNode: CodeNode,
  whiteboardNode: WhiteboardNode,
  imageNode: ImageNode,
};

export function WorkspaceCanvas({ presence }) {
  const { screenToFlowPosition } = useReactFlow();
  const navigate = useNavigate();
  const nodes = useWorkspaceStore((state) => state.nodes);
  const edges = useWorkspaceStore((state) => state.edges);
  const activeRoom = useWorkspaceStore((state) => state.activeRoom);
  const syncNodes = useWorkspaceStore((state) => state.setNodes);
  const syncEdges = useWorkspaceStore((state) => state.setEdges);
  const setViewportCenter = useWorkspaceStore(
    (state) => state.setViewportCenter,
  );
  const updateCode = useWorkspaceStore((state) => state.updateCodeContent);
  const updateWhiteboard = useWorkspaceStore(
    (state) => state.updateWhiteboardContent,
  );
  const updateImage = useWorkspaceStore((state) => state.updateImageUrl);
  const isApplyingRemoteState = useWorkspaceStore(
    (state) => state.isApplyingRemoteState,
  );
  const addNodeAtPosition = useWorkspaceStore(
    (state) => state.addNodeAtPosition,
  );
  const leaveRoom = useWorkspaceStore((state) => state.leaveRoom);

  useEffect(() => {
    if (!activeRoom?.expiresAt) {
      return;
    }

    const checkExpiration = () => {
      const diff = new Date(activeRoom.expiresAt) - new Date();
      if (diff <= 0) {
        clearInterval(interval);
        window.alert("This workspace has expired. Returning to dashboard.");
        leaveRoom();
        navigate("/meeting", { replace: true });
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [activeRoom?.expiresAt, navigate, leaveRoom]);

  const hydratedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          presence,
          yDoc: presence.doc,
          awareness: presence.awareness,
          onCodeChange: updateCode,
          onWhiteboardChange: updateWhiteboard,
          onImageChange: updateImage,
        },
      })),
    [nodes, presence, updateCode, updateImage, updateWhiteboard],
  );

  useEffect(() => {
    const updateCenter = () => {
      const pane = document.querySelector(".react-flow__pane");
      if (!pane) {
        return;
      }

      const rect = pane.getBoundingClientRect();
      const centerPoint = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      setViewportCenter(centerPoint);
    };

    updateCenter();
    window.addEventListener("resize", updateCenter);

    return () => {
      window.removeEventListener("resize", updateCenter);
    };
  }, [screenToFlowPosition, setViewportCenter]);

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();

          const file = item.getAsFile();
          if (!file) return;

          // Convert to base64
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Url = event.target.result;

            // Get current mouse position to place node
            const rect = document
              .querySelector('[style*="transform"]')
              ?.parentElement?.getBoundingClientRect();
            const x = rect?.width / 2 || 250;
            const y = rect?.height / 2 || 250;

            // Create new image node
            const newNodeId = `imageNode_${Date.now()}`;
            const newNode = {
              id: newNodeId,
              type: "imageNode",
              position: { x, y },
              data: {
                label: "Image",
                imageUrl: base64Url,
                imageKey: newNodeId,
              },
            };

            syncNodes([...nodes, newNode]);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [nodes, syncNodes]);

  // Drag and drop for node creation
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();

      const nodeType = e.dataTransfer.getData("nodeType");
      if (
        !nodeType ||
        !["imageNode", "codeNode", "whiteboardNode"].includes(nodeType)
      ) {
        return;
      }

      const reactFlowBounds = document
        .querySelector(".react-flow")
        ?.getBoundingClientRect();

      if (!reactFlowBounds) return;

      const dropPosition = screenToFlowPosition({
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      });

      addNodeAtPosition(nodeType, dropPosition);
    },
    [screenToFlowPosition, addNodeAtPosition],
  );

  useEffect(() => {
    const canvas = document.querySelector(".react-flow");
    if (!canvas) return;

    canvas.addEventListener("dragover", handleDragOver);
    canvas.addEventListener("drop", handleDrop);

    return () => {
      canvas.removeEventListener("dragover", handleDragOver);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [handleDragOver, handleDrop]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.86),rgba(255,255,255,0.54)),rgba(255,255,255,0.36)]">
      <ReactFlow
        className="h-full w-full"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodes={hydratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        nodesFocusable
        edgesFocusable
        panOnDrag
        selectionOnDrag
        onlyRenderVisibleElements={true}
        onMoveEnd={() => {
          const pane = document.querySelector(".react-flow__pane");
          if (!pane) {
            return;
          }

          const rect = pane.getBoundingClientRect();
          setViewportCenter(
            screenToFlowPosition({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            }),
          );
        }}
        onNodesChange={(changes) => {
          if (isApplyingRemoteState) return;
          syncNodes(applyNodeChanges(changes, nodes));
        }}
        onEdgesChange={(changes) => {
          if (isApplyingRemoteState) return;
          syncEdges(applyEdgeChanges(changes, edges));
        }}
        onConnect={(connection) => syncEdges(addEdge(connection, edges))}
      >
        {hydratedNodes.length === 0 ? (
          <Panel position="top-center">
            <div className="grid min-w-80 gap-1.5 rounded-[18px] border border-slate-900/12 bg-white/92 px-[18px] py-3.5 text-center shadow-[0_18px_42px_rgba(19,32,51,0.12)]">
              <strong className="text-xl font-semibold text-slate-950 sm:text-2xl">
                Start by adding a node
              </strong>
              <span className="text-[15px] text-slate-500">
                Open the hamburger menu and drop in an image, code, or
                whiteboard node.
              </span>
            </div>
          </Panel>
        ) : null}
        <MiniMap
          pannable
          zoomable
          position="top-right"
          className="!m-[18px] !overflow-hidden !rounded-[18px] !border !border-slate-900/12 !bg-white/88 !shadow-[0_16px_36px_rgba(19,32,51,0.14)]"
          nodeStrokeColor="#132033"
          nodeColor="rgba(19, 32, 51, 0.18)"
          maskColor="rgba(255, 255, 255, 0.72)"
        />
        <Background gap={18} size={1} color="#d5d9df" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
