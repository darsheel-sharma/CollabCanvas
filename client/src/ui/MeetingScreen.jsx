import { WorkspaceCanvas } from "../canvas/WorkspaceCanvas.jsx";
import { Toolbox } from "./Toolbox.jsx";
import { MeetingControls } from "./MeetingControls.jsx";
import { VideoGrid } from "./VideoGrid.jsx";

/**
 * The wrapper for an active workspace session. 
 * Combines the Canvas, Toolbox, Video Grid, and Meeting Controls into one view.
 */
export function MeetingScreen({ presence }) {
  return (
    <main className="h-screen overflow-hidden p-0">
      <section className="relative h-screen w-full">
        <WorkspaceCanvas presence={presence} />
        <Toolbox />
        <VideoGrid presence={presence} />
        <MeetingControls presence={presence} />
      </section>
    </main>
  );
}
