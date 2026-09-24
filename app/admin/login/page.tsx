"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (r.ok) router.replace("/admin");
    else setError("Wrong password.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-deep px-6">
      <form onSubmit={submit} className="w-full max-w-sm border border-cold-500/25 p-8">
        <p className="label mb-6">The Social Network · admin</p>
        <h1 className="headline mb-8 text-3xl text-cold-100">Sign in.</h1>
        <label htmlFor="password" className="label mb-2 block text-[10px]">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full border border-cold-500/50 bg-transparent px-4 py-3 font-mono text-[13px] text-cold-100 outline-none focus:border-amber"
        />
        {error && <p className="mb-4 text-[12px] text-amber" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-amber px-5 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-deep transition-colors duration-500 hover:bg-amber-soft disabled:opacity-60"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
