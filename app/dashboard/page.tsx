"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestMatch, getProfileCompletion, getResumes } from "@/lib/storage/storage";
import { Resume } from "@/lib/types/resume";
import { createClient } from "@/lib/supabase/client";
import { getLocalDemoUser } from "@/lib/auth/local-demo";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("there");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [jobsAnalyzed, setJobsAnalyzed] = useState(0);
  const [bestMatch, setBestMatch] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    function loadWorkspace() {
      const savedResumes = getResumes();
      setResumes(savedResumes);
      setProfileCompletion(getProfileCompletion());
      setBestMatch(getLatestMatch()?.score ?? null);
      try {
        setJobsAnalyzed(JSON.parse(localStorage.getItem("resumepilot_analyses") || "[]").length);
      } catch {
        setJobsAnalyzed(0);
      }
    }

    async function initialise() {
      const localUser = getLocalDemoUser();
      if (localUser) {
        if (!active) return;
        setUserName(localUser.name);
        loadWorkspace();
        setReady(true);
        return;
      }

      try {
        const { data } = await createClient().auth.getUser();
        if (!active) return;
        if (!data.user) {
          router.replace("/signin?redirect=/dashboard");
          return;
        }
        const name = typeof data.user.user_metadata.full_name === "string"
          ? data.user.user_metadata.full_name
          : data.user.email?.split("@")[0] ?? "there";
        setUserName(name);
        loadWorkspace();
        setReady(true);
      } catch {
        if (active) router.replace("/signin?error=auth_unavailable&redirect=/dashboard");
      }
    }

    void initialise();
    window.addEventListener("focus", loadWorkspace);
    return () => {
      active = false;
      window.removeEventListener("focus", loadWorkspace);
    };
  }, [router]);

  if (!ready) {
    return <div className="grid min-h-[calc(100vh-73px)] place-items-center text-sm text-slate-400">Loading your workspace…</div>;
  }

  const nextStep = profileCompletion < 70
    ? { label: "Finish your master profile", href: "/dashboard/profile", note: "A complete profile makes every resume stronger." }
    : resumes.length === 0
      ? { label: "Create your first targeted resume", href: "/dashboard/create-resume", note: "Use your profile as the starting point, then add the job details." }
      : { label: "Review your latest resume", href: `/dashboard/preview?id=${resumes[0].id}`, note: "Keep tailoring each version to the role you want." };

  return (
    <main className="min-h-[calc(100vh-73px)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-400">Your career workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {userName.split(" ")[0]}</h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">Build targeted resumes, compare them with roles, and keep the best versions organized.</p>
          </div>
          <Link href="/dashboard/create-resume" className="rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Create resume</Link>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 via-indigo-500/10 to-transparent p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Recommended next step</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><h2 className="text-xl font-bold sm:text-2xl">{nextStep.label}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{nextStep.note}</p></div>
            <Link href={nextStep.href} className="shrink-0 rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-slate-100">Continue</Link>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/25"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${profileCompletion}%` }} /></div>
          <p className="mt-2 text-xs text-slate-400">Master profile completeness: {profileCompletion}%</p>
        </section>

        <section aria-label="Workspace metrics" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Profile completion" value={`${profileCompletion}%`} detail="Master profile" />
          <Metric label="Resumes created" value={String(resumes.length)} detail="Saved on this device" />
          <Metric label="ATS analyses" value={String(jobsAnalyzed)} detail="Completed checks" />
          <Metric label="Latest job match" value={bestMatch === null ? "—" : `${bestMatch}%`} detail="Most recent comparison" />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <ActionCard title="Create a resume" text="Start a role-specific draft from your master profile." href="/dashboard/create-resume" action="Create resume" />
          <ActionCard title="Check ATS readiness" text="See which core sections and role keywords need attention." href="/dashboard/analyzer" action="Run analysis" />
          <ActionCard title="Match a job" text="Compare a saved resume against a job description before you apply." href="/dashboard/match" action="Compare role" />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><h2 className="font-semibold">Recent resumes</h2><p className="mt-1 text-sm text-slate-500">Your saved drafts are available on this browser.</p></div>
            <Link href="/dashboard/history" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">View all resumes</Link>
          </div>
          {resumes.slice(0, 5).map((resume) => (
            <div key={resume.id} className="flex flex-col gap-4 border-b border-white/5 px-5 py-5 last:border-0 sm:px-6 md:flex-row md:items-center md:justify-between">
              <div><h3 className="font-semibold">{resume.title}</h3><p className="mt-1 text-sm text-slate-500">{resume.targetRole || "No target role yet"} <span aria-hidden="true">·</span> Updated {new Date(resume.updatedAt).toLocaleDateString()}</p></div>
              <div className="flex gap-2"><Link href={`/dashboard/preview?id=${resume.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5">Preview</Link><Link href={`/dashboard/create-resume?id=${resume.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5">Edit</Link></div>
            </div>
          ))}
          {!resumes.length && <div className="px-6 py-12 text-center"><p className="font-medium text-slate-300">No resumes yet</p><p className="mt-2 text-sm text-slate-500">Finish your profile, then make the first version for a role you want.</p><Link href="/dashboard/create-resume" className="mt-5 inline-flex rounded-lg border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10">Create your first resume</Link></div>}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function ActionCard({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{text}</p><Link href={href} className="mt-5 inline-flex text-sm font-semibold text-cyan-400 hover:text-cyan-300">{action} <span className="ml-1" aria-hidden="true">→</span></Link></div>;
}
