import { useEffect, useMemo } from "react";
import { ReactFlowProvider } from "reactflow";
import { AuthScreen } from "./ui/AuthScreen.jsx";
import { LobbyScreen } from "./ui/LobbyScreen.jsx";
import { MeetingScreen } from "./ui/MeetingScreen.jsx";
import { useCollabSession } from "./hooks/useCollabSession.js";
import { useWorkspaceStore } from "./store/workspaceStore.js";

function App() {
  const user = useWorkspaceStore((state) => state.user);
  const activeRoom = useWorkspaceStore((state) => state.activeRoom);
  const syncRoomFromUrl = useWorkspaceStore((state) => state.syncRoomFromUrl);
  const hydrateSession = useWorkspaceStore((state) => state.hydrateSession);

  useEffect(() => {
    syncRoomFromUrl();
    hydrateSession();
  }, [hydrateSession, syncRoomFromUrl]);

  const roomId = activeRoom?.roomId ?? null;
  const presence = useCollabSession({
    enabled: Boolean(user && roomId),
    workspaceId: roomId,
    user,
  });

  const stage = useMemo(() => {
    if (!user) {
      return "auth";
    }

    if (!activeRoom?.joined) {
      return "lobby";
    }

    return "meeting";
  }, [activeRoom?.joined, user, activeRoom]);

  if (stage === "auth") {
    return <AuthScreen />;
  }

  if (stage === "lobby") {
    return <LobbyScreen />;
  }

  return (
    <ReactFlowProvider>
      <MeetingScreen presence={presence} />
    </ReactFlowProvider>
  );
}

export default App;
