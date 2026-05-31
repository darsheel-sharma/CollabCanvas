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
  const setLocalStream = useWorkspaceStore((state) => state.setLocalStream);
  const leaveRoom = useWorkspaceStore((state) => state.leaveRoom);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const statusText = useMemo(
    () => `${presence.status} - ${presence.participants.length}/4 in room`,
    [presence.participants.length, presence.status],
  );

  async function enableAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
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
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none sm:bottom-6">
      
      {/* Floating status badges above the capsule when open */}
      {isOpen ? (
        <div className="mb-3.5 flex flex-col items-center gap-1.5 animate-fadeIn">
          <PresenceBadge status={presence.status} label={statusText} />
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold px-2.5 py-0.5 rounded-full bg-white/80 border border-slate-900/10 backdrop-blur-sm shadow-sm">
            Room Code: {activeRoom?.roomId}
          </span>
        </div>
      ) : null}

      {/* Main capsule bar / button */}
      {!isOpen ? (
        <button
          className="h-[74px] w-[74px] rounded-full border-none bg-[linear-gradient(145deg,#132033_0%,#30557b_100%)] text-[1.45rem] font-bold text-white shadow-[0_20px_40px_rgba(19,32,51,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_50px_rgba(19,32,51,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          type="button"
          aria-label="Open controls"
          onClick={() => setIsOpen(true)}
        >
          <span>{user?.name?.slice(0, 1)?.toUpperCase() ?? "U"}</span>
        </button>
      ) : (
        <aside className="h-[74px] px-2 flex items-center justify-between rounded-full border border-slate-900/15 bg-white/96 shadow-[0_24px_52px_rgba(19,32,51,0.25)] backdrop-blur-xl animate-fadeIn min-w-[340px]">
          
          {/* Left section: 2 Buttons */}
          <div className="flex items-center gap-2 pl-2">
            {/* Audio Toggle Icon */}
            <button
              onClick={toggleMute}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition duration-150 ${
                isMuted 
                  ? "bg-red-50 text-red-600 hover:bg-red-100" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              type="button"
            >
              {isMuted ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            {/* Audio Refresh Icon */}
            <button
              onClick={enableAudio}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition duration-150 hover:bg-slate-200"
              title={hasAudioPermission ? "Refresh Audio Connection" : "Enable Audio"}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </button>
          </div>

          {/* Middle section: Circle User Icon (Diameter is exactly the side length/height of capsule: 74px) */}
          <div className="mx-2">
            <button
              className="h-[74px] w-[74px] rounded-full border-none bg-[linear-gradient(145deg,#132033_0%,#30557b_100%)] text-[1.45rem] font-bold text-white shadow-[0_4px_12px_rgba(19,32,51,0.2)] hover:scale-105 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              type="button"
              aria-label="Close controls"
              onClick={() => setIsOpen(false)}
            >
              <span>{user?.name?.slice(0, 1)?.toUpperCase() ?? "U"}</span>
            </button>
          </div>

          {/* Right section: 2 Buttons */}
          <div className="flex items-center gap-2 pr-2">
            {/* Copy Link Icon */}
            <button
              onClick={copyLink}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition duration-150 hover:bg-slate-200"
              title="Copy Room Invitation Link"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>

            {/* Leave Room Icon */}
            <button
              onClick={() => {
                leaveRoom();
                navigate("/meeting", { replace: true });
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 transition duration-150 hover:bg-red-100"
              title="Leave Workspace"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </aside>
      )}
    </div>
  );
}
