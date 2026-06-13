import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "../store/workspaceStore.js";

function VideoPlayer({ participant, stream, muted, isLocal, localIsVideoEnabled }) {
  const videoRef = useRef(null);

  // For local user, we rely on the explicit toggle state.
  // For remote users, we verify if they are transmitting a stream with video tracks.
  const hasVideo = isLocal
    ? (!!stream && localIsVideoEnabled)
    : (!!stream && stream.getVideoTracks().length > 0);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, hasVideo]);

  const name = participant?.displayName || "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-[0_12px_24px_rgba(19,32,51,0.2)]" style={{ width: 220, height: 124 }}>
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white text-lg font-bold shadow-md">
            {initial}
          </div>
          <span className="mt-2 text-xs font-semibold">{name}</span>
          {/* We still mount a hidden audio element if it's a remote stream without video but has audio */}
          {!isLocal && stream && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="hidden"
            />
          )}
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm">
        {isLocal ? "You" : name}
      </div>
    </div>
  );
}

/**
 * Renders a grid of video players for all peers currently in the workspace.
 * Includes both the local user's camera feed and incoming remote WebRTC streams.
 */
export function VideoGrid({ presence }) {
  const localStream = useWorkspaceStore((state) => state.localStream);
  const isVideoEnabled = useWorkspaceStore((state) => state.isVideoEnabled);
  const remoteStreams = useWorkspaceStore((state) => state.remoteStreams);
  const user = useWorkspaceStore((state) => state.user);

  const participants = presence?.participants || [];

  if (participants.length === 0 && !localStream) {
    return null;
  }

  return (
    <aside className="absolute bottom-6 right-6 z-40 flex flex-col-reverse gap-4 select-none">
      {participants.map((p) => {
        const isLocal = p.peerId === presence?.client?.clientId;
        const stream = isLocal ? localStream : remoteStreams[p.peerId];

        return (
          <div key={p.peerId} className="animate-fadeIn">
            <VideoPlayer 
              participant={p} 
              stream={stream} 
              muted={isLocal} 
              isLocal={isLocal} 
              localIsVideoEnabled={isVideoEnabled}
            />
          </div>
        );
      })}
    </aside>
  );
}
