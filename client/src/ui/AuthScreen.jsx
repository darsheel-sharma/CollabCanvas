import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaceStore.js";

const inputClassName =
  "w-full rounded-2xl border border-slate-900/15 bg-white/92 px-4 py-3 text-left text-slate-900 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:border-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300";
const primaryButtonClassName =
  "rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-slate-50 shadow-[0_12px_30px_rgba(19,32,51,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(19,32,51,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-70";
const textButtonClassName =
  "mt-4 border-none bg-transparent p-0 text-sm font-medium text-blue-800 transition hover:-translate-y-0.5 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

/**
 * Renders the authentication screen for login and signup.
 * Automatically redirects users back to their originally requested URL after successful auth.
 */
export function AuthScreen() {
  const authMode = useWorkspaceStore((state) => state.authMode);
  const authStatus = useWorkspaceStore((state) => state.authStatus);
  const authError = useWorkspaceStore((state) => state.authError);
  const setAuthMode = useWorkspaceStore((state) => state.setAuthMode);
  const submitAuth = useWorkspaceStore((state) => state.submitAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function resolveNextPath() {
    const nextPath = searchParams.get("next");

    if (nextPath?.startsWith("/")) {
      return nextPath;
    }

    return location.state?.from?.pathname ?? "/meeting";
  }

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(19,32,51,0.07),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(214,161,76,0.22),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.55))] px-5 py-8 sm:px-7">
      <section className="w-full max-w-[560px] rounded-[28px] border-2 border-slate-900/20 bg-white/82 p-9 shadow-[0_18px_60px_rgba(19,32,51,0.12)] backdrop-blur-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
          Step 1
        </p>
        <h1 className="mb-3 text-3xl font-bold text-slate-950">
          {authMode === "login" ? "Login to continue" : "Create your account"}
        </h1>
        <p className="max-w-[58ch] leading-7 text-slate-600">
          Sign in first, then you will move to a separate meeting setup screen where you can
          create or join a room before entering the workspace.
        </p>
        <form
          className="mt-6 grid gap-3.5"
          onSubmit={async (event) => {
            event.preventDefault();
            const user = await submitAuth({ ...form, mode: authMode });

            if (user) {
              navigate(resolveNextPath(), { replace: true });
            }
          }}
        >
          {authMode === "signup" ? (
            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              Name
              <input
                className={inputClassName}
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Aman"
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Email
            <input
              className={inputClassName}
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="aman@example.com"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Password
            <input
              className={inputClassName}
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Minimum 6 characters"
            />
          </label>
          {authError ? <p className="text-sm text-red-700">{authError}</p> : null}
          <button className={primaryButtonClassName} type="submit" disabled={authStatus === "loading"}>
            {authStatus === "loading"
              ? "Please wait..."
              : authMode === "login"
                ? "Login"
                : "Sign up"}
          </button>
        </form>
        <button
          className={textButtonClassName}
          type="button"
          onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
        >
          {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </section>
    </main>
  );
}
