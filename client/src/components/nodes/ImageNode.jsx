export function ImageNode({ data }) {
  return (
    <article className="workspace-node">
      <header className="node-drag-handle">
        <strong>{data.label}</strong>
        <span>Reference</span>
      </header>
      <div className="node-body image-node-body">
        <input
          className="node-input nodrag"
          type="url"
          value={data.imageUrl}
          placeholder="Paste image URL"
          onChange={(event) => data.onImageChange?.(event.target.value, data.imageKey)}
        />
        {data.imageUrl ? (
          <img className="node-image-preview" src={data.imageUrl} alt={data.label} />
        ) : (
          <div className="node-image-empty">Paste an image link to preview it here.</div>
        )}
      </div>
    </article>
  );
}
