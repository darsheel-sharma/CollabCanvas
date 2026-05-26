import { useMemo, useState } from "react";
import { useWorkspaceStore } from "../store/workspaceStore.js";
import { PresenceBadge } from "./PresenceBadge.jsx";

export function MeetingControls({ presence }) {
  const activeRoom = useWorkspaceStore((state) => state.activeRoom);
  const user = useWorkspaceStore((state) => state.user);
  const isMuted = useWorkspaceStore((state) => state.isMuted);
  const hasAudioPermission = useWorkspaceStore((state) => state.hasAudioPermission);
  const toggleMute = useWorkspaceStore((state) => state.toggleMute);
  const setAudioPermission = useWorkspaceStore((state) => state.setAudioPermission);
  const leaveRoom = useWorkspaceStore((state) => state.leaveRoom);
  const [isOpen, setIsOpen] = useState(false);

  const statusText = useMemo(
    () => `${presence.status} · ${presence.participants.length}/4 in room`,
    [presence.participants.length, presence.status],
  );

  async function enableAudio() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setAudioPermission(true);
    } catch (error) {
      window.alert(`Audio access failed: ${error.message}`);
    }
  }

  async function copyLink() {
    if (!activeRoom?.shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(activeRoom.shareUrl);
    window.alert("Meeting link copied.");
  }

  return (
    <div className={`meeting-controls-floating ${isOpen ? "open" : ""}`}>
      <button
        className="meeting-controls-trigger"
        type="button"
        aria-label="Toggle meeting controls"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{user?.name?.slice(0, 1)?.toUpperCase() ?? "U"}</span>
      </button>
      {isOpen ? (
        <aside className="meeting-controls-panel">
          <div className="meeting-controls-header">
            <PresenceBadge status={presence.status} label={statusText} />
            <div className="session-meta">
              <span>Room</span>
              <strong>{activeRoom?.roomId}</strong>
            </div>
          </div>
          <div className="controls-group">
            <div className="control-pill">
              <span>Host</span>
              <strong>{user?.name}</strong>
            </div>
            <div className="control-pill">
              <span>Audio</span>
              <strong>{hasAudioPermission ? (isMuted ? "Muted" : "Live") : "Not enabled"}</strong>
            </div>
          </div>
          <div className="controls-group vertical">
            <button className="secondary-button" type="button" onClick={enableAudio}>
              {hasAudioPermission ? "Refresh audio" : "Enable audio"}
            </button>
            <button className="secondary-button" type="button" onClick={toggleMute}>
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button className="secondary-button" type="button" onClick={copyLink}>
              Copy room link
            </button>
            <button className="danger-button" type="button" onClick={leaveRoom}>
              Leave meeting
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
