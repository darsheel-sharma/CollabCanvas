import { useState } from "react";
import { useWorkspaceStore } from "../store/workspaceStore.js";

export function AuthScreen() {
  const authMode = useWorkspaceStore((state) => state.authMode);
  const authStatus = useWorkspaceStore((state) => state.authStatus);
  const authError = useWorkspaceStore((state) => state.authError);
  const setAuthMode = useWorkspaceStore((state) => state.setAuthMode);
  const submitAuth = useWorkspaceStore((state) => state.submitAuth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  return (
    <main className="stage-shell">
      <section className="auth-card">
        <p className="eyebrow">Step 1</p>
        <h1>{authMode === "login" ? "Login to your workspace" : "Create your account"}</h1>
        <p className="stage-copy">
          Start with a lightweight identity so you can create a meeting link and join the
          collaborative workspace.
        </p>
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitAuth({ ...form, mode: authMode });
          }}
        >
          {authMode === "signup" ? (
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Aman"
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="aman@example.com"
            />
          </label>
          <label>
            Password
            <input
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
          {authError ? <p className="error-text">{authError}</p> : null}
          <button className="primary-button" type="submit">
            {authStatus === "loading"
              ? "Please wait..."
              : authMode === "login"
                ? "Login"
                : "Sign up"}
          </button>
        </form>
        <button
          className="text-button"
          type="button"
          onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
        >
          {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </section>
    </main>
  );
}
