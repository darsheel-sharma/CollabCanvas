export function ImageNode({ data }) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-slate-900/15 bg-white/96 shadow-[0_14px_32px_rgba(19,32,51,0.12)]">
      <header className="flex cursor-grab items-center justify-between gap-3 bg-slate-950 px-3.5 py-3 text-slate-50 active:cursor-grabbing">
        <strong>{data.label}</strong>
        <span className="text-xs opacity-80">Reference</span>
      </header>
      <div className="grid gap-2.5 p-3.5">
        <input
          className="nodrag w-full rounded-2xl border border-slate-900/15 bg-white/94 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus-visible:border-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300"
          type="url"
          value={data.imageUrl}
          placeholder="Paste image URL"
          onChange={(event) => data.onImageChange?.(event.target.value, data.imageKey)}
        />
        {data.imageUrl ? (
          <img
            className="h-[180px] w-full rounded-2xl border border-slate-900/12 object-cover"
            src={data.imageUrl}
            alt={data.label}
          />
        ) : (
          <div className="grid min-h-[120px] place-items-center rounded-2xl border border-dashed border-slate-900/25 px-4 text-center text-slate-500">
            Paste an image link to preview it here.
          </div>
        )}
      </div>
    </article>
  );
}
