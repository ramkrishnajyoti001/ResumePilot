"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearResumePilotData, getSettings, saveSettings } from "@/lib/storage/storage";
import { defaultSettings } from "@/lib/data/defaults";
import { ResumePilotSettings } from "@/lib/types/resume";
import { createClient } from "@/lib/supabase/client";
import { getLocalDemoUser, startLocalDemoSession } from "@/lib/auth/local-demo";
import { resumeTemplates } from "@/lib/resume/templates";

export default function SettingsPage() {
  const [settings, setSettings] = useState<ResumePilotSettings>(defaultSettings);
  const [name, setName] = useState("Your account");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const settingsTimer = window.setTimeout(() => {
      setSettings(getSettings() || defaultSettings);
    }, 0);
    const localUser = getLocalDemoUser();
    if (localUser) {
      const localUserTimer = window.setTimeout(() => {
        setName(localUser.name);
        setEmail(localUser.email);
        setReady(true);
      }, 0);
      return () => {
        window.clearTimeout(settingsTimer);
        window.clearTimeout(localUserTimer);
      };
    } else {
      void createClient().auth.getUser()
        .then(({ data }) => {
          const user = data.user;
          if (user) {
            setName(typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0] ?? "Your account");
            setEmail(user.email ?? "");
          }
          setReady(true);
        })
        .catch(() => setReady(true));
    }
    return () => window.clearTimeout(settingsTimer);
  }, []);

  function handleSave() {
    saveSettings(settings);
    setMessage("Preferences saved.");
    window.setTimeout(() => setMessage(""), 2500);
  }

  function clearWorkspace() {
    if (!window.confirm("Remove saved resumes, profile details, analyses, and preferences from this browser? Your signed-in account will remain active.")) return;
    const localUser = getLocalDemoUser();
    clearResumePilotData();
    if (localUser) startLocalDemoSession(localUser);
    setSettings(defaultSettings);
    setMessage("Browser workspace data cleared. Your account remains signed in.");
  }

  return (
    <main className="min-h-[calc(100vh-73px)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header><p className="text-sm font-semibold text-cyan-400">Workspace settings</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Preferences and data</h1><p className="mt-2 text-sm text-slate-400">Set the defaults for new resumes and manage the data saved on this device.</p></header>
        {!ready ? <p className="mt-8 text-sm text-slate-400">Loading settings…</p> : <div className="mt-8 space-y-5">
          <Panel title="Account" description="Your authenticated ResumePilot account.">
            <div className="grid gap-4 sm:grid-cols-2"><Info label="Name" value={name} /><Info label="Email" value={email || "Not available"} /></div>
            <Link href="/dashboard/profile" className="mt-5 inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5">Edit master profile</Link>
          </Panel>
          <Panel title="Resume defaults" description="These choices will be preselected for every new resume.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="Default template" value={settings.defaultTemplate} onChange={(value) => setSettings((current) => ({ ...current, defaultTemplate: value as ResumePilotSettings["defaultTemplate"] }))} options={resumeTemplates.map((template) => [template.id, template.label])} />
              <Select label="Default layout" value={settings.defaultLayout} onChange={(value) => setSettings((current) => ({ ...current, defaultLayout: value as ResumePilotSettings["defaultLayout"] }))} options={[["compact", "Compact"], ["balanced", "Balanced"], ["spacious", "Spacious"]]} />
            </div>
          </Panel>
          <Panel title="Preferences" description="Control how the browser workspace behaves.">
            <Toggle label="Auto-save" detail="Keep new resume edits ready to save as you work." value={settings.autoSave} onChange={(value) => setSettings((current) => ({ ...current, autoSave: value }))} />
            <Toggle label="Notifications" detail="Reserve this preference for future account and application updates." value={settings.notifications} onChange={(value) => setSettings((current) => ({ ...current, notifications: value }))} />
          </Panel>
          <Panel title="Browser data" description="Resumes and full career details are currently stored in this browser so you retain direct control of drafts.">
            <button type="button" onClick={clearWorkspace} className="rounded-lg border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/10">Clear browser workspace data</button>
          </Panel>
          {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
          <div className="flex justify-end"><button type="button" onClick={handleSave} className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Save preferences</button></div>
        </div>}
      </div>
    </main>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p><div className="mt-5">{children}</div></section>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-all text-sm font-medium text-slate-200">{value}</p></div>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-400/70">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue} className="bg-slate-900">{optionLabel}</option>)}</select></label>;
}
function Toggle({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-6 border-b border-white/5 py-5 last:border-0 first:pt-0"><div><p className="text-sm font-medium text-slate-200">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div><button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? "bg-cyan-400" : "bg-slate-700"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${value ? "left-6" : "left-1"}`} /></button></div>;
}
