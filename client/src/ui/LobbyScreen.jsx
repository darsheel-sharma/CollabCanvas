import { useWorkspaceStore } from "../store/workspaceStore.js";

export function LobbyScreen() {
  const user = useWorkspaceStore((state) => state.user);
  const roomDraft = useWorkspaceStore((state) => state.roomDraft);
  const roomError = useWorkspaceStore((state) => state.roomError);
  const createRoom = useWorkspaceStore((state) => state.createRoom);
  const joinRoom = useWorkspaceStore((state) => state.joinRoom);
  const setRoomDraft = useWorkspaceStore((state) => state.setRoomDraft);
  const logout = useWorkspaceStore((state) => state.logout);

  return (
    <main className="stage-shell">
      <section className="lobby-card">
        <div className="lobby-intro">
          <p className="eyebrow">Step 2</p>
          <h1>Welcome, {user?.name}</h1>
          <p className="stage-copy">
            Create a meeting link, share it with your team, and up to four people can join
            the audio-only collaborative workspace.
          </p>
        </div>

        <div className="lobby-actions">
          <button className="primary-button big-button" type="button" onClick={createRoom}>
            Create Room Link
          </button>

          <div className="join-card">
            <label>
              Room code or meeting link
              <input
                value={roomDraft}
                onChange={(event) => setRoomDraft(event.target.value)}
                placeholder="meet-abc123 or full link"
              />
            </label>
            {roomError ? <p className="error-text">{roomError}</p> : null}
            <button className="secondary-button" type="button" onClick={joinRoom}>
              Join Meeting
            </button>
          </div>
        </div>

        <button className="text-button" type="button" onClick={logout}>
          Switch account
        </button>
      </section>
    </main>
  );
}
