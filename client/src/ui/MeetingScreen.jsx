import { WorkspaceCanvas } from "../canvas/WorkspaceCanvas.jsx";
import { Toolbox } from "./Toolbox.jsx";
import { MeetingControls } from "./MeetingControls.jsx";

export function MeetingScreen({ presence }) {
  return (
    <main className="h-screen overflow-hidden p-0">
      <section className="relative h-screen w-full">
        <WorkspaceCanvas presence={presence} />
        <Toolbox />
        <MeetingControls presence={presence} />
      </section>
    </main>
  );
}
