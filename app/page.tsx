"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestMatch, getResumes } from "../lib/storage/storage";
import { getProfileCompletion } from "../lib/storage/storage";
import { createClient } from "@/lib/supabase/client";
import { getLocalDemoUser } from "@/lib/auth/local-demo";

const features = [
  ["01", "Master Profile", "Keep your education, skills, projects, certifications and experience organized in one place."],
  ["02", "Resume Tailoring", "Create a role-specific resume from the information already stored in your Master Profile."],
  ["03", "Job Description Analysis", "Analyze a job description and extract relevant keywords from it."],
  ["04", "Resume Match", "Compare a saved resume with a job description and see matched and missing keywords."],
  ["05", "Resume History", "Keep every saved resume version organized and editable."],
  ["06", "Live Preview", "Review the actual resume generated from your saved profile before applying."],
];

const steps = [
  ["01", "Create your profile", "Add your career information once and keep it ready."],
  ["02", "Create a resume", "Choose a target role and paste the job description."],
  ["03", "Analyze and match", "Run the built-in ATS and job-match analysis."],
  ["04", "Review and improve", "Edit, preview and save different versions for different roles."],
];

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState({ profile: 0, resumes: 0, match: null as number | null, role: "No resume yet" });
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const statsTimer = window.setTimeout(() => {
      const resumes = getResumes();
      const latest = getLatestMatch();
      setStats({
        profile: getProfileCompletion(),
        resumes: resumes.length,
        match: latest?.score ?? null,
        role: resumes[0]?.targetRole || "No resume yet",
      });
    }, 0);

    let active = true;
    const localUser = getLocalDemoUser();

    if (localUser) {
      const localUserTimer = window.setTimeout(() => setLoggedIn(true), 0);
      return () => {
        active = false;
        window.clearTimeout(localUserTimer);
        window.clearTimeout(statsTimer);
      };
    }

    const supabase = createClient();

    void supabase.auth.getUser()
      .then(({ data }) => {
        if (active) setLoggedIn(Boolean(data.user));
      })
      .catch(() => {
        if (active) setLoggedIn(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setLoggedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      window.clearTimeout(statsTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <nav className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <button onClick={() => router.push("/")} className="text-2xl font-bold tracking-tight">Resume<span className="text-blue-600">Pilot</span></button>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600">How It Works</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600">About</a>
          </div>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button onClick={() => router.push(loggedIn ? "/dashboard" : "/signin")} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white">{loggedIn ? "Dashboard" : "Sign In"}</button>
            <button onClick={() => router.push(loggedIn ? "/dashboard/create-resume" : "/signup")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{loggedIn ? "Create Resume" : "Sign Up"}</button>
          </div>
        </div>
      </nav>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Resume management workspace</div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">Build once.<br/><span className="text-blue-600">Tailor for every role.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">Create one structured career profile, turn it into role-specific resumes, analyze job descriptions and keep every version connected.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => router.push(loggedIn ? "/dashboard/create-resume" : "/signup")} className="rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white hover:bg-blue-700">{loggedIn ? "Create Your Resume" : "Create Your Profile"}</button>
              <a href="#how-it-works" className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-center font-semibold text-slate-700 hover:bg-slate-50">See How It Works</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-500"><span>✓ One Master Profile</span><span>✓ Saved resume versions</span><span>✓ ATS + job matching</span></div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"><div className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><p className="font-semibold">ResumePilot</p><p className="text-xs text-slate-500">Your actual workspace data</p></div><div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">Profile {stats.profile}%</div></div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <Card label="Master Profile" value={`${stats.profile}%`} />
              <Card label="Resumes" value={String(stats.resumes)} />
              <Card label="Latest Match" value={stats.match === null ? "—" : `${stats.match}%`} />
            </div>
            <div className="mx-5 mb-5 rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{stats.role}</p><p className="mt-1 text-sm text-slate-500">{stats.resumes ? "Saved resume" : "Create your first resume"}</p></div>{stats.match !== null && <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{stats.match}% Match</span>}</div>{stats.match !== null && <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${stats.match}%`}}/></div>}</div>
          </div></div>
        </div></div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white px-6 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Features</p><h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Everything in one connected workflow.</h2><div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{features.map(([n,t,d])=><div key={n} className="rounded-2xl border border-slate-200 p-6"><div className="text-sm font-bold text-blue-600">{n}</div><h3 className="mt-5 text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{d}</p></div>)}</div></div></section>
      <section id="how-it-works" className="px-6 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">How It Works</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">From profile to application-ready resume.</h2><div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">{steps.map(([n,t,d])=><div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm font-bold text-blue-600">{n}</div><h3 className="mt-5 text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{d}</p></div>)}</div></div></section>
      <section id="about" className="border-y border-slate-200 bg-white px-6 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">About ResumePilot</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">A simpler way to manage your career profile.</h2><p className="mt-5 text-lg leading-8 text-slate-600">ResumePilot keeps your career information structured in one place so that each resume can reuse the same source data without rebuilding everything manually.</p><p className="mt-8 font-semibold">Built by Ramkrishna Jyoti</p><p className="mt-1 text-sm text-slate-500">B.Tech CSE — AI & ML</p></div><div className="mt-12 rounded-2xl bg-slate-950 p-8 text-white"><h2 className="text-2xl font-bold">Ready to build your next resume?</h2><p className="mt-2 text-slate-400">Create your profile once and keep improving every application.</p><button onClick={() => router.push(loggedIn ? "/dashboard/create-resume" : "/signup")} className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500">Get Started</button></div></div></section>
      <footer className="px-6 py-10"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between"><div><span className="font-bold text-slate-900">Resume<span className="text-blue-600">Pilot</span></span><span className="ml-3">AI-powered tools for creating and managing role-specific resumes.</span></div><div>© 2026 ResumePilot. All rights reserved.</div></div></footer>
    </main>
  );
}
function Card({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>}
