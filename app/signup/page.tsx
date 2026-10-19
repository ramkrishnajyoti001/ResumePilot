"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { canUseLocalDemo, startLocalDemoSession } from "@/lib/auth/local-demo";

export default function SignupPage() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localDemoAvailable, setLocalDemoAvailable] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLocalDemoAvailable(canUseLocalDemo()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function signUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (!data.session || !data.user) {
        setError("Account created, but no session was returned. Check Supabase email confirmation settings and try signing in.");
        return;
      }

      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          full_name: cleanName,
          email: cleanEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("We could not reach the account service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function openLocalWorkspace() {
    startLocalDemoSession({ name, email });
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold tracking-tight">
            Resume<span className="text-cyan-400">Pilot</span>
          </div>

          <p className="mt-2 text-sm text-gray-400">
            Create your account and build your master resume.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur">
          <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Create account</h1>
                <p className="mt-1 text-sm text-gray-400">
                  Create an account with your email and password.
                </p>
              </div>

              <form onSubmit={signUp} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex- Ramkrishna Jyoti"
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              {localDemoAvailable && (
                <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">Just testing locally?</p>
                  <p className="mt-1 text-xs leading-5 text-amber-200/80">Open the complete browser-local workspace without waiting for an email code. This is only available during local development.</p>
                  <button type="button" onClick={openLocalWorkspace} className="mt-3 rounded-lg border border-amber-300/30 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/10">Open local workspace</button>
                </div>
              )}
          </>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signin")}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}
