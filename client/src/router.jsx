import { useEffect } from "react";
import { Navigate, createBrowserRouter, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import App from "./App.jsx";
import { useCollabSession } from "./hooks/useCollabSession.js";
import { useWorkspaceStore } from "./store/workspaceStore.js";
import { AuthScreen } from "./ui/AuthScreen.jsx";
import { LobbyScreen } from "./ui/LobbyScreen.jsx";
import { MeetingScreen } from "./ui/MeetingScreen.jsx";

function buildAuthRedirectTarget(location) {
  return `/auth?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
}

function GuestRoute() {
  const user = useWorkspaceStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  if (user) {
    return <Navigate to={nextPath?.startsWith("/") ? nextPath : "/meeting"} replace />;
  }

  return <AuthScreen />;
}

function ProtectedRoute({ children }) {
  const user = useWorkspaceStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to={buildAuthRedirectTarget(location)} replace state={{ from: location }} />;
  }

  return children;
}

function MeetingPage() {
  const syncRoomFromRoute = useWorkspaceStore((state) => state.syncRoomFromRoute);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");

  useEffect(() => {
    syncRoomFromRoute(roomId, false);
  }, [roomId, syncRoomFromRoute]);

  return <LobbyScreen />;
}

function WorkspacePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useWorkspaceStore((state) => state.user);
  const activeRoom = useWorkspaceStore((state) => state.activeRoom);
  const syncRoomFromRoute = useWorkspaceStore((state) => state.syncRoomFromRoute);
  const presence = useCollabSession({
    enabled: Boolean(user && roomId),
    workspaceId: roomId,
    user,
  });

  useEffect(() => {
    if (!roomId) {
      navigate("/meeting", { replace: true });
      return;
    }

    syncRoomFromRoute(roomId, true);
  }, [navigate, roomId, syncRoomFromRoute]);

  useEffect(() => {
    if (roomId && activeRoom && !activeRoom.joined) {
      navigate(`/meeting?room=${roomId}`, { replace: true });
    }
  }, [activeRoom, navigate, roomId]);

  if (!roomId) {
    return null;
  }

  return (
    <ReactFlowProvider>
      <MeetingScreen presence={presence} />
    </ReactFlowProvider>
  );
}

function IndexRedirect() {
  const user = useWorkspaceStore((state) => state.user);
  return <Navigate to={user ? "/meeting" : "/auth"} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <IndexRedirect /> },
      { path: "auth", element: <GuestRoute /> },
      {
        path: "meeting",
        element: (
          <ProtectedRoute>
            <MeetingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "workspace/:roomId",
        element: (
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
