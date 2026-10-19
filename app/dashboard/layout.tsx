"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { endLocalDemoSession, getLocalDemoUser } from "@/lib/auth/local-demo";

const navigation = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/profile", label: "Master profile" },
  { href: "/dashboard/history", label: "Resumes" },
  { href: "/dashboard/analyzer", label: "ATS analysis" },
  { href: "/dashboard/match", label: "Job match" },
];

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("Your account");
  const [email, setEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    const localUser = getLocalDemoUser();

    if (localUser) {
      const localUserTimer = window.setTimeout(() => {
        setDisplayName(localUser.name);
        setEmail(localUser.email);
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(localUserTimer);
      };
    }

    const supabase = createClient();

    async function loadAccount() {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;

      const name =
        typeof data.user.user_metadata.full_name === "string"
          ? data.user.user_metadata.full_name
          : data.user.email?.split("@")[0] ?? "Your account";

      setDisplayName(name);
      setEmail(data.user.email ?? "");
    }

    void loadAccount().catch(() => {
      // The account UI can still render if the remote auth service is down.
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      const name =
        typeof session.user.user_metadata.full_name === "string"
          ? session.user.user_metadata.full_name
          : session.user.email?.split("@")[0] ?? "Your account";
      setDisplayName(name);
      setEmail(session.user.email ?? "");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);

    if (getLocalDemoUser()) {
      endLocalDemoSession();
      router.replace("/");
      router.refresh();
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut().catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      <header className="print-hidden sticky top-0 z-30 border-b border-white/10 bg-[#07090f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="shrink-0 text-xl font-black tracking-tight text-white"
            aria-label="ResumePilot dashboard"
          >
            Resume<span className="text-cyan-400">Pilot</span>
          </Link>

          <nav aria-label="Workspace" className="hidden flex-1 items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white sm:block"
            >
              Settings
            </Link>
            <div className="hidden max-w-40 text-right sm:block">
              <p className="truncate text-xs font-semibold text-slate-200">{displayName}</p>
              {email && <p className="truncate text-[11px] text-slate-500">{email}</p>}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>

        <nav aria-label="Workspace" className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
          {navigation.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active ? "bg-white/10 text-white" : "text-slate-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
