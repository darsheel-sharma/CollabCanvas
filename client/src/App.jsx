import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useWorkspaceStore } from "./store/workspaceStore.js";

/**
 * Displays a full-screen loading state while checking the user's
 * session token against the backend to determine their auth status.
 */
function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(19,32,51,0.07),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(214,161,76,0.22),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.55))] px-5 py-8 sm:px-7">
      <section className="w-full max-w-[560px] rounded-[28px] border-2 border-slate-900/20 bg-white/82 p-9 shadow-[0_18px_60px_rgba(19,32,51,0.12)] backdrop-blur-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
          Loading
        </p>
        <h1 className="mb-3 text-3xl font-bold text-slate-950">Restoring your session</h1>
        <p className="max-w-[58ch] leading-7 text-slate-600">
          We are checking your saved login so we can send you to the right page.
        </p>
      </section>
    </main>
  );
}

/**
 * Root application component. Handles session hydration before
 * rendering the router outlet.
 */
function App() {
  const hydrateSession = useWorkspaceStore((state) => state.hydrateSession);
  const isSessionHydrated = useWorkspaceStore((state) => state.isSessionHydrated);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  if (!isSessionHydrated) {
    return <LoadingScreen />;
  }

  return <Outlet />;
}

export default App;
