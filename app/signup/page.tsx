"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { canUseLocalDemo, startLocalDemoSession } from "@/lib/auth/local-demo";

const OTP_LENGTH = 8;

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
  const [otp, setOtp] = useState("");

  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [localDemoAvailable, setLocalDemoAvailable] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLocalDemoAvailable(canUseLocalDemo()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function sendOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

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

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setShowOtp(true);
      setMessage(`A ${OTP_LENGTH}-digit verification code has been sent to your email.`);
    } catch {
      setError("We could not reach the account service. Use the local workspace below while developing.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.replace(/\D/g, "");

if (cleanOtp.length !== OTP_LENGTH) {
  setError(`Please enter the complete ${OTP_LENGTH}-digit code. Current digits: ${cleanOtp.length}`);
  return;
}

    const finalOtp = cleanOtp;

    setLoading(true);
    try {
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: finalOtp,
      type: "email",
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session || !data.user) {
      setError("Verification completed, but no login session was created.");
      return;
    }

    // Keep the basic account profile in sync when the optional profiles table exists.
    // A profile-sync error should never block a successful account verification.
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: name.trim(),
        email: cleanEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    router.replace("/dashboard");
    router.refresh();
    } catch {
      setError("We could not reach the account service. Use the local workspace below while developing.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email first.");
      return;
    }

    setResending(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("A new OTP has been sent to your email.");
    } catch {
      setError("We could not reach the account service. Use the local workspace below while developing.");
    } finally {
      setResending(false);
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
          {!showOtp ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Create account</h1>
                <p className="mt-1 text-sm text-gray-400">
                  Enter your details to continue.
                </p>
              </div>

              <form onSubmit={sendOtp} className="space-y-5">
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
                  {loading ? "Sending OTP..." : "Continue"}
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
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold">Verify your email</h1>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  We sent a {OTP_LENGTH}-digit verification code to
                </p>

                <p className="mt-1 break-all text-sm font-medium text-cyan-400">
                  {email}
                </p>
              </div>

              <form onSubmit={verifyOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="otp"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Verification code
                  </label>

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_LENGTH}
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setOtp(value);
                    }}
                    placeholder="12345678"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {message && !error && (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-300">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.replace(/\D/g, "").length < OTP_LENGTH}
                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify email"}
                </button>

                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resending}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false);
                    setOtp("");
                    setError("");
                    setMessage("");
                  }}
                  className="w-full text-sm text-gray-500 transition hover:text-gray-300"
                >
                  Change email
                </button>
              </form>
            </>
          )}
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
