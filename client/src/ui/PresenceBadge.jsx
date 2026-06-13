/**
 * Displays a small colored indicator representing the current WebSocket connection status.
 */
export function PresenceBadge({ status, label }) {
  const statusClassName =
    status === "connected"
      ? "bg-green-600"
      : status === "connecting"
        ? "bg-amber-600"
        : "bg-red-600";

  return (
    <div className="flex items-center gap-2.5 rounded-[18px] border border-slate-900/12 bg-white/82 px-4 py-3">
      <span className={`h-[11px] w-[11px] rounded-full ${statusClassName}`} />
      <strong className="text-sm font-semibold text-slate-900">{label}</strong>
    </div>
  );
}
