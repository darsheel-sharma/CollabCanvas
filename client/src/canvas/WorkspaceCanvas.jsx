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
  const setViewportCenter = useWorkspaceStore((state) => state.setViewportCenter);
  const updateCode = useWorkspaceStore((state) => state.updateCodeContent);
  const updateWhiteboard = useWorkspaceStore((state) => state.updateWhiteboardContent);
  const updateImage = useWorkspaceStore((state) => state.updateImageUrl);
  const isApplyingRemoteState = useWorkspaceStore((state) => state.isApplyingRemoteState);

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
                Open the hamburger menu and drop in an image, code, or whiteboard node.
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
