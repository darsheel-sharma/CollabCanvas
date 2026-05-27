export function WhiteboardNode({ data }) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-slate-900/15 bg-white/96 shadow-[0_14px_32px_rgba(19,32,51,0.12)]">
      <header className="flex cursor-grab items-center justify-between gap-3 bg-slate-950 px-3.5 py-3 text-slate-50 active:cursor-grabbing">
        <strong>{data.label}</strong>
        <span className="text-xs opacity-80">Notes</span>
      </header>
      <div className="p-3.5">
        <textarea
          className="nodrag min-h-40 w-full resize-y rounded-2xl border border-slate-900/15 bg-white/94 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus-visible:border-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300"
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
