import {
  Background,
  Controls,
  Panel,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from "reactflow";
import { useEffect, useMemo } from "react";
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
  const nodes = useWorkspaceStore((state) => state.nodes);
  const edges = useWorkspaceStore((state) => state.edges);
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

  // FIX APPLIED HERE: Subscribe to the mute flag
  const isApplyingRemoteState = useWorkspaceStore(
    (state) => state.isApplyingRemoteState,
  );

  const hydratedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          presence,
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

  return (
    <div className="workspace-shell">
      <ReactFlow
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodes={hydratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        panOnDrag
        selectionOnDrag
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
          // FIX APPLIED HERE: Mute canvas updates if they came from the network
          if (isApplyingRemoteState) return;
          syncNodes(applyNodeChanges(changes, nodes));
        }}
        onEdgesChange={(changes) => {
          // FIX APPLIED HERE: Mute canvas updates if they came from the network
          if (isApplyingRemoteState) return;
          syncEdges(applyEdgeChanges(changes, edges));
        }}
        onConnect={(connection) => syncEdges(addEdge(connection, edges))}
      >
        {hydratedNodes.length === 0 ? (
          <Panel position="top-center">
            <div className="workspace-empty-state">
              <strong>Start by adding a node</strong>
              <span>
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
          className="workspace-minimap"
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
