import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "../store/workspaceStore.js";

function VideoPlayer({ stream, muted, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border-2 border-slate-900/10 shadow-[0_12px_24px_rgba(19,32,51,0.2)]" style={{ width: 220, height: 124 }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
      />
      {isLocal && (
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm">
          You
        </div>
      )}
    </div>
  );
}

export function VideoGrid() {
  const localStream = useWorkspaceStore((state) => state.localStream);
  const isVideoEnabled = useWorkspaceStore((state) => state.isVideoEnabled);
  const remoteStreams = useWorkspaceStore((state) => state.remoteStreams);

  const remoteEntries = Object.entries(remoteStreams);

  if (!localStream && remoteEntries.length === 0) {
    return null;
  }

  return (
    <aside className="absolute top-6 right-6 z-40 flex flex-col gap-4 select-none">
      {/* Local Video */}
      {localStream && isVideoEnabled && (
        <div className="animate-fadeIn">
          <VideoPlayer stream={localStream} muted={true} isLocal={true} />
        </div>
      )}

      {/* Remote Videos (Renders even if video is off so audio plays) */}
      {remoteEntries.map(([peerId, stream]) => (
        <div key={peerId} className="animate-fadeIn">
          <VideoPlayer stream={stream} muted={false} isLocal={false} />
        </div>
      ))}
    </aside>
  );
}
