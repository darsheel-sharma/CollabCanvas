import { NodeResizer } from "reactflow";
import { useWorkspaceStore } from "../../store/workspaceStore.js";

/**
 * A custom ReactFlow node representing a simple, synchronized scratchpad/whiteboard.
 */
export function WhiteboardNode({ data, id, selected }) {
  const deleteNode = useWorkspaceStore((state) => state.deleteNode);

  const handleDelete = () => {
    if (window.confirm("Delete this node?")) {
      deleteNode(id);
    }
  };

  return (
    <>
      <NodeResizer
        minWidth={0}
        minHeight={0}
        isVisible={selected}
        lineClassName="!border-amber-500 !border-2 !rounded-[20px]"
        handleClassName="!w-4 !h-4 !bg-white !border-2 !border-amber-500 !rounded-full !shadow-md hover:!scale-115 active:!scale-95 transition-transform duration-100"
      />
      <article
        className={`group relative w-full h-full overflow-hidden rounded-[20px] border-[5px] bg-slate-900 flex flex-col transition-all duration-200 ${
          selected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-slate-950/80 hover:bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md focus:outline-none"
          title="Delete whiteboard node"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <div className="w-full h-full flex-1 overflow-hidden flex flex-col p-3.5 bg-white">
          <div className="w-full h-full rounded-[12px] overflow-hidden border border-slate-100 shadow-inner">
            <textarea
              className="nodrag w-full h-full resize-none border-none bg-slate-50/50 hover:bg-slate-50 px-4 py-3 text-slate-800 placeholder-slate-400 outline-none transition focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-slate-100"
              value={data.content}
              placeholder="Sketch ideas, task notes, or rough specs here."
              onChange={(event) =>
                data.onWhiteboardChange?.(event.target.value, data.whiteboardKey)
              }
            />
          </div>
        </div>
      </article>
    </>
  );
}
