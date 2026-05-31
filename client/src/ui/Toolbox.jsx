import { useState } from "react";
import { useWorkspaceStore } from "../store/workspaceStore.js";

const tools = [
  { type: "imageNode", label: "Image Node", hint: "References" },
  { type: "codeNode", label: "Code Node", hint: "Editor" },
  { type: "whiteboardNode", label: "Whiteboard", hint: "Sketches" },
];

export function Toolbox() {
  const addNode = useWorkspaceStore((state) => state.addNode);
  const [isOpen, setIsOpen] = useState(false);
  const [draggedType, setDraggedType] = useState(null);

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData("nodeType", type);
    e.dataTransfer.effectAllowed = "move";
    setDraggedType(type);

    const dragImage = new Image();
    dragImage.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect fill='%235b21b6' width='50' height='50' rx='8'/%3E%3Ctext x='25' y='25' font-size='12' fill='white' text-anchor='middle' dominant-baseline='middle'%3E+%3C/text%3E%3C/svg%3E";
    e.dataTransfer.setDragImage(dragImage, 25, 25);
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  const handleClick = (type) => {
    addNode(type);
    setIsOpen(false);
  };

  return (
    <aside className="absolute left-[18px] top-[18px] z-30">
      <button
        className="grid h-[62px] w-[62px] content-center gap-1.5 rounded-[18px] border-none bg-slate-950/95 px-4 shadow-[0_18px_36px_rgba(19,32,51,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(19,32,51,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        type="button"
        aria-label="Toggle node menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="block h-[3px] rounded-full bg-white" />
        <span className="block h-[3px] rounded-full bg-white" />
        <span className="block h-[3px] rounded-full bg-white" />
      </button>
      {isOpen ? (
        <div className="mt-3 w-[248px] rounded-3xl border border-slate-900/15 bg-white/95 p-4 shadow-[0_22px_48px_rgba(19,32,51,0.18)] backdrop-blur-xl">
          <p className="mb-3 text-sm font-bold text-slate-900">Add nodes</p>
          <p className="mb-3 text-xs text-slate-500">
            💡 Drag to canvas or click for center
          </p>
          <div className="grid gap-3.5">
            {tools.map((tool) => (
              <button
                key={tool.type}
                draggable
                onDragStart={(e) => handleDragStart(e, tool.type)}
                onDragEnd={handleDragEnd}
                onClick={() => handleClick(tool.type)}
                className={`grid gap-1 rounded-2xl border px-3 py-3 text-left transition cursor-move font-medium ${
                  draggedType === tool.type
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300 opacity-60"
                    : "border-slate-900/15 bg-white hover:-translate-y-0.5 hover:shadow-md"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300`}
                type="button"
              >
                <strong className="text-sm font-semibold text-slate-900">
                  {tool.label}
                </strong>
                <span className="text-xs text-slate-500">{tool.hint}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
