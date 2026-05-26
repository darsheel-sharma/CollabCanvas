import { WorkspaceCanvas } from "../canvas/WorkspaceCanvas.jsx";
import { Toolbox } from "./Toolbox.jsx";
import { MeetingControls } from "./MeetingControls.jsx";

export function MeetingScreen({ presence }) {
  return (
    <main className="meeting-shell">
      <section className="meeting-board">
        <WorkspaceCanvas presence={presence} />
        <Toolbox />
        <MeetingControls presence={presence} />
      </section>
    </main>
  );
}
