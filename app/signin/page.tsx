"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { canUseLocalDemo, startLocalDemoSession } from "@/lib/auth/local-demo";

const OTP_LENGTH = 8;

export default function SigninPage() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [localDemoAvailable, setLocalDemoAvailable] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocalDemoAvailable(canUseLocalDemo());
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "auth_callback_failed") {
        setError("Email verification could not be completed. Please try again.");
      }
      if (params.get("error") === "auth_unavailable") {
        setError("The account service is temporarily unavailable. You can use the local workspace below while it is restored.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSignin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setNotice("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
    const supabase = getSupabase();

    if (showOtp) {
      const cleanOtp = otp.replace(/\D/g, "");
      if (cleanOtp.length !== OTP_LENGTH) {
        setError(`Please enter the ${OTP_LENGTH}-digit code sent to your email.`);
        return;
      }

      const { data, error: signinError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });

      if (signinError || !data.user) {
        setError(signinError?.message || "Unable to verify this code. Please try again.");
        return;
      }

      finishSignin();
      return;
    }

    if (!password) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }

      setShowOtp(true);
      setNotice(`An ${OTP_LENGTH}-digit sign-in code has been sent to your email.`);
      return;
    }

    const { data, error: signinError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signinError) {
      setError(signinError.message);
      return;
    }

    if (!data.user) {
      setError("Unable to sign in. Please try again.");
      return;
    }

    finishSignin();
    } catch {
      setError("We could not reach the account service. Check Supabase, or use the local workspace while developing.");
    } finally {
      setLoading(false);
    }
  }

  function finishSignin() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    router.replace(redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard");
    router.refresh();
  }

  async function resendSigninCode() {
    setError("");
    setNotice("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address first.");
      return;
    }

    setResending(true);
    try {
      const { error: otpError } = await getSupabase().auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setNotice(`A new ${OTP_LENGTH}-digit sign-in code has been sent to your email.`);
    } catch {
      setError("We could not reach the account service. Please try again after Supabase is available.");
    } finally {
      setResending(false);
    }
  }

  async function sendPasswordReset() {
    setError("");
    setNotice("");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Enter your email first, then request a password reset.");
      return;
    }

    setResetting(true);
    try {
      const supabase = getSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setNotice("If an account exists for this email, a password reset link has been sent.");
    } catch {
      setError("We could not reach the account service. Please try again after Supabase is available.");
    } finally {
      setResetting(false);
    }
  }

  function openLocalWorkspace() {
    startLocalDemoSession({ email });
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center">
        <div className="w-full">
          <Link
            href="/"
            className="text-3xl font-black tracking-tight"
          >
            Resume<span className="text-blue-500">Pilot</span>
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-400">
                ResumePilot
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Sign in to continue working on your resumes.
              </p>
            </div>

            <form onSubmit={handleSignin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                  required
                />
              </div>

              {!showOtp ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold">Password <span className="font-normal text-slate-500">(optional)</span></label>

                    <button
                      type="button"
                      onClick={sendPasswordReset}
                      disabled={resetting}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetting ? "Sending…" : "Forgot password?"}
                    </button>
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to receive an email code"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">New to ResumePilot? Leave this blank and we’ll email you a sign-in code.</p>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold">Email verification code</label><button type="button" onClick={() => { setShowOtp(false); setOtp(""); setError(""); }} className="text-xs font-semibold text-blue-400 hover:text-blue-300">Use password instead</button></div>
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={OTP_LENGTH} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))} placeholder="12345678" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 tracking-[0.35em] outline-none transition placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-500" required />
                  <p className="mt-2 text-xs leading-5 text-slate-500">We sent an 8-digit code to {email}.</p>
                  <button
                    type="button"
                    onClick={resendSigninCode}
                    disabled={resending || loading}
                    className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resending ? "Sending code…" : "Resend code"}
                  </button>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {notice && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait…" : showOtp ? "Verify and sign in" : password ? "Sign in with password" : "Email me a sign-in code"}
              </button>
            </form>

            {localDemoAvailable && (
              <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-sm font-semibold text-amber-100">Local development workspace</p>
                <p className="mt-1 text-xs leading-5 text-amber-200/80">Use all resume features in this browser without contacting Supabase. This option is not included in production.</p>
                <button type="button" onClick={openLocalWorkspace} className="mt-3 rounded-lg border border-amber-300/30 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/10">Open local workspace</button>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-blue-400 hover:text-blue-300"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
