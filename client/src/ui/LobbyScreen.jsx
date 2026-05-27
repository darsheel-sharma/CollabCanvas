import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaceStore.js";

const primaryButtonClassName =
  "min-h-[120px] rounded-[22px] bg-slate-950 px-6 py-5 text-left text-lg font-semibold text-slate-50 shadow-[0_12px_30px_rgba(19,32,51,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(19,32,51,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";
const secondaryButtonClassName =
  "rounded-2xl border border-slate-900/15 bg-white/88 px-4 py-3 font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";
const inputClassName =
  "w-full rounded-2xl border border-slate-900/15 bg-white/94 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus-visible:border-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300";
const textButtonClassName =
  "mt-4 border-none bg-transparent p-0 text-sm font-medium text-blue-800 transition hover:-translate-y-0.5 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

export function LobbyScreen() {
  const user = useWorkspaceStore((state) => state.user);
  const roomDraft = useWorkspaceStore((state) => state.roomDraft);
  const roomError = useWorkspaceStore((state) => state.roomError);
  const createRoom = useWorkspaceStore((state) => state.createRoom);
  const joinRoom = useWorkspaceStore((state) => state.joinRoom);
  const setRoomDraft = useWorkspaceStore((state) => state.setRoomDraft);
  const logout = useWorkspaceStore((state) => state.logout);
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04)),radial-gradient(circle_at_top,rgba(214,161,76,0.16),transparent_26%),linear-gradient(180deg,#fbf7ef_0%,#eef3f8_100%)] px-5 py-8 sm:px-7">
      <section className="w-full max-w-[900px] rounded-[28px] border-2 border-slate-900/20 bg-white/82 p-9 shadow-[0_18px_60px_rgba(19,32,51,0.12)] backdrop-blur-sm">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
            Step 2
          </p>
          <h1 className="mb-3 text-3xl font-bold text-slate-950">
            Meeting setup for {user?.name}
          </h1>
          <p className="max-w-[58ch] leading-7 text-slate-600">
            Create a meeting link or join an existing one here. The workspace only opens after
            you choose a room.
          </p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <button
            className={primaryButtonClassName}
            type="button"
            onClick={() => {
              const roomId = createRoom();
              navigate(`/workspace/${roomId}`);
            }}
          >
            Create Room Link
          </button>

          <div className="grid gap-3.5 rounded-[22px] border-2 border-slate-900/12 bg-white/66 p-[22px]">
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              Room code or meeting link
              <input
                className={inputClassName}
                value={roomDraft}
                onChange={(event) => setRoomDraft(event.target.value)}
                placeholder="meet-abc123 or full link"
              />
            </label>
            {roomError ? <p className="text-sm text-red-700">{roomError}</p> : null}
            <button
              className={secondaryButtonClassName}
              type="button"
              onClick={() => {
                const roomId = joinRoom();

                if (roomId) {
                  navigate(`/workspace/${roomId}`);
                }
              }}
            >
              Join Meeting
            </button>
          </div>
        </div>

        <button
          className={textButtonClassName}
          type="button"
          onClick={async () => {
            await logout();
            navigate("/auth", { replace: true });
          }}
        >
          Switch account
        </button>
      </section>
    </main>
  );
}
