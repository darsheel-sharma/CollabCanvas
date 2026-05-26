export function WhiteboardNode({ data }) {
  return (
    <article className="workspace-node">
      <header className="node-drag-handle">
        <strong>{data.label}</strong>
        <span>Notes</span>
      </header>
      <div className="node-body">
        <textarea
          className="node-textarea nodrag"
          value={data.content}
          placeholder="Sketch ideas, task notes, or rough specs here."
          onChange={(event) =>
            data.onWhiteboardChange?.(event.target.value, data.whiteboardKey)
          }
        />
      </div>
    </article>
  );
}
