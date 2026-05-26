export function PresenceBadge({ status, label }) {
  return (
    <div className="presence-badge">
      <span className={`presence-dot ${status}`} />
      <strong>{label}</strong>
    </div>
  );
}

