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

  return (
    <aside className={`toolbox-overlay ${isOpen ? "open" : ""}`}>
      <button
        className="toolbox-toggle"
        type="button"
        aria-label="Toggle node menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
      {isOpen ? (
        <div className="toolbox-panel">
          <p className="toolbox-title">Add nodes</p>
          <div className="toolbox-list">
            {tools.map((tool) => (
              <button
                key={tool.type}
                className="toolbox-button"
                type="button"
                onClick={() => {
                  addNode(tool.type);
                  setIsOpen(false);
                }}
              >
                <strong>{tool.label}</strong>
                <span>{tool.hint}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
