"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = getSupabase();

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        setError("This password reset link is no longer valid. Request a new one from sign in.");
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }

    setSaving(true);
    const supabase = getSupabase();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="text-3xl font-black tracking-tight">
          Resume<span className="text-blue-500">Pilot</span>
        </Link>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-400">Account recovery</p>
          <h1 className="mt-2 text-3xl font-black">Choose a new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use a password you do not reuse elsewhere.</p>

          {loading ? (
            <p className="mt-8 text-sm text-slate-400">Checking your recovery link…</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block text-sm font-semibold">
                New password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-blue-500"
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                Confirm password
                <input
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-blue-500"
                  required
                />
              </label>
              {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
              <button
                type="submit"
                disabled={saving || Boolean(error && !password)}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Updating password…" : "Save new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
