import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaceStore.js";

const primaryButtonClassName =
  "w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 px-6 py-4 font-semibold text-white shadow-[0_12px_30px_rgba(19,32,51,0.2)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(19,32,51,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryButtonClassName =
  "rounded-2xl border border-slate-950/10 bg-white/70 px-4 py-3 font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";
const inputClassName =
  "w-full rounded-2xl border border-slate-950/10 bg-white/94 px-4 py-3 text-slate-800 shadow-sm outline-none transition focus-visible:border-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300";
const textButtonClassName =
  "border-none bg-transparent p-0 text-sm font-semibold text-amber-700 transition hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";

// Live Countdown Timer for Workspace Card
function WorkspaceCard({ workspace, onEnter, onDelete }) {
  const [timeLeft, setTimeLeft] = useState("");
  const expiresAt = workspace.expiresAt;

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("Permanent");
      return;
    }

    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/workspace/${workspace.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert("Workspace link copied to clipboard!");
    } catch (err) {
      window.alert("Failed to copy link.");
    }
  };

  const isExpired = timeLeft === "Expired";

  if (isExpired) return null; // Don't render expired workspaces

  return (
    <article 
      onClick={() => onEnter(workspace.slug)}
      className="group relative flex flex-col justify-between rounded-[24px] border border-slate-950/10 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-slate-950/20 hover:bg-white hover:shadow-[0_20px_50px_rgba(19,32,51,0.08)] cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-950 group-hover:text-amber-700 transition duration-200 truncate pr-4">
            {workspace.name}
          </h3>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            expiresAt ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${expiresAt ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            {timeLeft}
          </span>
        </div>
        
        <p className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Code: {workspace.slug}
        </p>

        <p className="mt-4 text-xs text-slate-500">
          Created: {new Date(workspace.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={handleCopyLink}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950/5 text-slate-700 transition duration-150 hover:bg-slate-950/10 hover:text-slate-900"
          title="Copy invite link"
          type="button"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Are you sure you want to delete this workspace? This cannot be undone.")) {
                onDelete(workspace.id);
              }
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 transition duration-150 hover:bg-red-100 hover:text-red-700"
            title="Delete workspace"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <button
            onClick={() => onEnter(workspace.slug)}
            className="h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition duration-200 hover:bg-amber-700"
            type="button"
          >
            Enter
          </button>
        </div>
      </div>
    </article>
  );
}

export function DashboardScreen() {
  const user = useWorkspaceStore((state) => state.user);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isLoading = useWorkspaceStore((state) => state.isLoadingWorkspaces);
  const roomDraft = useWorkspaceStore((state) => state.roomDraft);
  const roomError = useWorkspaceStore((state) => state.roomError);
  
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const verifyAndJoinWorkspace = useWorkspaceStore((state) => state.verifyAndJoinWorkspace);
  const setRoomDraft = useWorkspaceStore((state) => state.setRoomDraft);
  const logout = useWorkspaceStore((state) => state.logout);
  const navigate = useNavigate();

  // Create Workspace Form State
  const [wsName, setWsName] = useState("");
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [presetDuration, setPresetDuration] = useState("60"); // default 1 hour in minutes
  const [customVal, setCustomVal] = useState("12");
  const [customUnit, setCustomUnit] = useState("hours"); // minutes, hours, days
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    setIsSubmitting(true);
    let durationMinutes = 0;
    if (hasTimeLimit) {
      if (presetDuration === "custom") {
        const val = parseInt(customVal, 10);
        if (isNaN(val) || val <= 0) {
          window.alert("Please enter a valid custom duration.");
          setIsSubmitting(false);
          return;
        }
        if (customUnit === "minutes") durationMinutes = val;
        else if (customUnit === "hours") durationMinutes = val * 60;
        else if (customUnit === "days") durationMinutes = val * 24 * 60;
      } else {
        durationMinutes = parseInt(presetDuration, 10);
      }
    }

    try {
      const ws = await createWorkspace({
        name: wsName.trim(),
        hasTimeLimit,
        durationMinutes,
      });
      navigate(`/workspace/${ws.slug}`);
    } catch (err) {
      window.alert(`Failed to create workspace: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const draft = roomDraft.trim();
    if (!draft) return;

    let slug = draft;
    // Extract slug from full URLs if pasted
    if (draft.includes("/workspace/")) {
      slug = draft.split("/workspace/")[1].split("?")[0].split("#")[0];
    } else if (draft.includes("room=")) {
      try {
        slug = new URL(draft).searchParams.get("room");
      } catch {
        slug = draft;
      }
    }

    try {
      await verifyAndJoinWorkspace(slug);
      navigate(`/workspace/${slug}`);
    } catch (err) {
      window.alert(err.message || "Failed to join workspace. It may be expired or not found.");
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04)),radial-gradient(circle_at_top,rgba(214,161,76,0.14),transparent_32%),linear-gradient(180deg,#fcfaf5_0%,#f0f4f8_100%)] px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Upper Header Row */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-950/5 pb-6 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Workspace Hub</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl mt-1">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-500 mt-1 text-[15px]">
              Create naming workspaces with customizable lifetimes or enter active ones to collaborate in real-time.
            </p>
          </div>
          <button
            className={secondaryButtonClassName}
            type="button"
            onClick={async () => {
              await logout();
              navigate("/auth", { replace: true });
            }}
          >
            Switch Account
          </button>
        </header>

        {/* Dashboard Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left Column: Create & Join Form (5 cols) */}
          <section className="lg:col-span-5 grid gap-8">
            
            {/* Create Workspace Panel */}
            <div className="rounded-[28px] border-2 border-slate-950/15 bg-white/70 p-6 sm:p-8 shadow-[0_20px_50px_rgba(19,32,51,0.06)] backdrop-blur-md">
              <h2 className="text-2xl font-bold text-slate-950 mb-6">Create Workspace</h2>
              
              <form onSubmit={handleCreate} className="grid gap-6">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Workspace Name
                  <input
                    className={inputClassName}
                    required
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    placeholder="E.g., UI Redesign Brainstorming"
                    type="text"
                  />
                </label>

                {/* Lifetime Selection Cards */}
                <div className="grid gap-2 text-sm font-bold text-slate-700">
                  <span>Workspace Lifetime</span>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <button
                      type="button"
                      onClick={() => setHasTimeLimit(false)}
                      className={`flex flex-col text-left p-4 rounded-2xl border-2 transition duration-200 ${
                        !hasTimeLimit
                          ? "border-slate-950 bg-slate-950 text-white shadow-md shadow-slate-950/10"
                          : "border-slate-950/10 bg-white/50 text-slate-800 hover:border-slate-950/20"
                      }`}
                    >
                      <strong className="text-[15px] font-bold">Permanent</strong>
                      <span className={`text-xs mt-1 leading-normal ${!hasTimeLimit ? "text-slate-300" : "text-slate-400"}`}>
                        Never expires. Keeps content indefinitely.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHasTimeLimit(true)}
                      className={`flex flex-col text-left p-4 rounded-2xl border-2 transition duration-200 ${
                        hasTimeLimit
                          ? "border-slate-950 bg-slate-950 text-white shadow-md shadow-slate-950/10"
                          : "border-slate-950/10 bg-white/50 text-slate-800 hover:border-slate-950/20"
                      }`}
                    >
                      <strong className="text-[15px] font-bold">Time-Limited</strong>
                      <span className={`text-xs mt-1 leading-normal ${hasTimeLimit ? "text-slate-300" : "text-slate-400"}`}>
                        Expires automatically after chosen limit.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expiration Details: Duration selector (only visible if Time-Limited) */}
                {hasTimeLimit ? (
                  <div className="grid gap-3 rounded-2xl bg-slate-950/5 p-4 border border-slate-950/5 animate-fadeIn">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Duration Limit</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "1 Hour", val: "60" },
                        { label: "4 Hours", val: "240" },
                        { label: "24 Hours", val: "1440" },
                        { label: "7 Days", val: "10080" },
                        { label: "Custom", val: "custom" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setPresetDuration(item.val)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            presetDuration === item.val
                              ? "bg-slate-950 text-white"
                              : "bg-white border border-slate-950/10 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Picker Fields */}
                    {presetDuration === "custom" ? (
                      <div className="flex gap-2 items-center mt-2">
                        <input
                          className={`${inputClassName} !py-2 !px-3 !w-24 text-center font-bold`}
                          value={customVal}
                          onChange={(e) => setCustomVal(e.target.value)}
                          type="number"
                          min="1"
                        />
                        <select
                          className="rounded-2xl border border-slate-950/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || !wsName.trim()}
                  className={primaryButtonClassName}
                >
                  {isSubmitting ? "Creating..." : "Create Workspace"}
                </button>
              </form>
            </div>

            {/* Join Workspace Panel */}
            <div className="rounded-[28px] border-2 border-slate-950/15 bg-white/70 p-6 sm:p-8 shadow-[0_20px_50px_rgba(19,32,51,0.06)] backdrop-blur-md">
              <h2 className="text-xl font-bold text-slate-950 mb-3">Join a Workspace</h2>
              <p className="text-xs text-slate-500 mb-4">
                Access a colleague's workspace by entering its code or direct sharing link below.
              </p>

              <form onSubmit={handleJoin} className="grid gap-3.5">
                <input
                  className={inputClassName}
                  value={roomDraft}
                  onChange={(e) => setRoomDraft(e.target.value)}
                  placeholder="Paste ws-xxxxxx or full sharing link"
                  type="text"
                />
                {roomError ? <p className="text-xs font-semibold text-red-700">{roomError}</p> : null}
                <button
                  className={secondaryButtonClassName}
                  type="submit"
                  disabled={!roomDraft.trim()}
                >
                  Join Workspace
                </button>
              </form>
            </div>

          </section>

          {/* Right Column: Workspaces List (7 cols) */}
          <section className="lg:col-span-7">
            <h2 className="text-2xl font-extrabold text-slate-950 mb-6 flex items-center justify-between">
              <span>Your Active Workspaces</span>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 rounded-full px-3 py-1">
                {workspaces.length} Total
              </span>
            </h2>

            {isLoading ? (
              <div className="grid h-48 place-items-center rounded-[28px] border-2 border-dashed border-slate-950/10 bg-white/40">
                <div className="flex flex-col items-center gap-2">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                  <span className="text-sm font-semibold text-slate-500">Loading workspaces...</span>
                </div>
              </div>
            ) : workspaces.length === 0 ? (
              // Empty State Illustration Card
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-[28px] border-2 border-dashed border-slate-950/12 bg-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <strong className="text-lg font-bold text-slate-950">No Active Workspaces</strong>
                <p className="mt-1 text-sm text-slate-500 max-w-[36ch] leading-relaxed">
                  You haven't created any workspaces yet. Fill out the form on the left to set up your first collaborative canvas!
                </p>
              </div>
            ) : (
              // Workspaces Grid
              <div className="grid gap-5 sm:grid-cols-2">
                {workspaces.map((ws) => (
                  <WorkspaceCard
                    key={ws.id}
                    workspace={ws}
                    onEnter={(slug) => {
                      setRoomDraft(slug);
                      navigate(`/workspace/${slug}`);
                    }}
                    onDelete={deleteWorkspace}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
