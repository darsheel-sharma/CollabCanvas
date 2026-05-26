export function AudioControlNode({ data }) {
  return (
    <article className="workspace-node">
      <header>
        <strong>{data.label}</strong>
        <span>WebRTC signaling</span>
      </header>
      <div className="node-body audio-panel">
        <p>
          Presence: <strong>{data.presence?.status ?? "disconnected"}</strong>
        </p>
        <p>
          Participants: <strong>{data.presence?.participants?.length ?? 0}</strong>
        </p>
        <button type="button" onClick={() => data.onSignalRequest?.()}>
          Prepare audio session
        </button>
      </div>
    </article>
  );
}

