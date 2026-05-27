import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaceStore.js";
import { PresenceBadge } from "./PresenceBadge.jsx";

const pillClassName =
  "flex flex-col justify-center gap-1 rounded-[18px] border border-slate-900/12 bg-white/82 px-4 py-3";
const pillLabelClassName = "text-xs uppercase tracking-[0.08em] text-slate-900/70";
const secondaryButtonClassName =
  "rounded-2xl border border-slate-900/15 bg-white/88 px-4 py-3 font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";
const dangerButtonClassName =
  "rounded-2xl bg-red-700 px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300";

export function MeetingControls({ presence }) {
  const activeRoom = useWorkspaceStore((state) => state.activeRoom);
  const user = useWorkspaceStore((state) => state.user);
  const isMuted = useWorkspaceStore((state) => state.isMuted);
  const hasAudioPermission = useWorkspaceStore((state) => state.hasAudioPermission);
  const toggleMute = useWorkspaceStore((state) => state.toggleMute);
  const setAudioPermission = useWorkspaceStore((state) => state.setAudioPermission);
  const leaveRoom = useWorkspaceStore((state) => state.leaveRoom);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const statusText = useMemo(
    () => `${presence.status} - ${presence.participants.length}/4 in room`,
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
    <div className="absolute bottom-4 right-4 z-30 flex items-end gap-4 sm:bottom-6 sm:right-6">
      <button
        className="h-[74px] w-[74px] rounded-full border-none bg-[linear-gradient(145deg,#132033_0%,#30557b_100%)] text-[1.45rem] font-bold text-white shadow-[0_20px_40px_rgba(19,32,51,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(19,32,51,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        type="button"
        aria-label="Toggle meeting controls"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{user?.name?.slice(0, 1)?.toUpperCase() ?? "U"}</span>
      </button>
      {isOpen ? (
        <aside className="w-[calc(100vw-108px)] max-w-[360px] rounded-[28px] border border-slate-900/15 bg-white/96 p-[18px] shadow-[0_24px_52px_rgba(19,32,51,0.2)] backdrop-blur-xl sm:w-[calc(100vw-124px)]">
          <div className="mb-3 grid gap-3">
            <PresenceBadge status={presence.status} label={statusText} />
            <div className={pillClassName}>
              <span className={pillLabelClassName}>Room</span>
              <strong className="text-sm font-semibold text-slate-900">{activeRoom?.roomId}</strong>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className={pillClassName}>
              <span className={pillLabelClassName}>Host</span>
              <strong className="text-sm font-semibold text-slate-900">{user?.name}</strong>
            </div>
            <div className={pillClassName}>
              <span className={pillLabelClassName}>Audio</span>
              <strong className="text-sm font-semibold text-slate-900">
                {hasAudioPermission ? (isMuted ? "Muted" : "Live") : "Not enabled"}
              </strong>
            </div>
          </div>
          <div className="mt-3.5 flex flex-col gap-3">
            <button className={secondaryButtonClassName} type="button" onClick={enableAudio}>
              {hasAudioPermission ? "Refresh audio" : "Enable audio"}
            </button>
            <button className={secondaryButtonClassName} type="button" onClick={toggleMute}>
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button className={secondaryButtonClassName} type="button" onClick={copyLink}>
              Copy room link
            </button>
            <button
              className={dangerButtonClassName}
              type="button"
              onClick={() => {
                leaveRoom();
                navigate("/meeting", { replace: true });
              }}
            >
              Leave meeting
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
