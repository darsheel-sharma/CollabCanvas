export function AudioControlNode({ data }) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-slate-900/15 bg-white/96 shadow-[0_14px_32px_rgba(19,32,51,0.12)]">
      <header className="flex items-center justify-between gap-3 bg-slate-950 px-3.5 py-3 text-slate-50">
        <strong>{data.label}</strong>
        <span className="text-xs opacity-80">WebRTC signaling</span>
      </header>
      <div className="grid gap-3.5 p-3.5">
        <p>
          Presence: <strong>{data.presence?.status ?? "disconnected"}</strong>
        </p>
        <p>
          Participants: <strong>{data.presence?.participants?.length ?? 0}</strong>
        </p>
        <button
          className="rounded-2xl border border-slate-900/15 bg-white/88 px-4 py-3 font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          type="button"
          onClick={() => data.onSignalRequest?.()}
        >
          Prepare audio session
        </button>
      </div>
    </article>
  );
}
