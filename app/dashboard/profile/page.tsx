"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultProfile } from "@/lib/data/defaults";
import { getProfile, saveProfile } from "@/lib/storage/storage";
import { getLocalDemoUser } from "@/lib/auth/local-demo";
import {
  Achievement,
  Certification,
  Education,
  Experience,
  MasterProfile,
  Project,
} from "@/lib/types/resume";

function createId() {
  return crypto.randomUUID();
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<MasterProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const localProfile = getProfile();
      const localUser = getLocalDemoUser();
      if (localUser) {
        const stored = localProfile ?? defaultProfile;
        if (!active) return;
        setProfile({
          ...stored,
          personal: {
            ...stored.personal,
            fullName: stored.personal.fullName || localUser.name,
            email: stored.personal.email || localUser.email,
          },
        });
        setLoading(false);
        return;
      }

      try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      let accountProfile: Record<string, string | null> | null = null;
      let accountSkills: string[] = [];

      if (user) {
        const [{ data: profileData }, { data: skillsData }] = await Promise.all([
          supabase.from("profiles").select("full_name,email,phone,location,linkedin,github,portfolio,professional_summary").eq("id", user.id).maybeSingle(),
          supabase.from("profile_skills").select("skill").eq("user_id", user.id).order("created_at", { ascending: true }),
        ]);
        accountProfile = profileData as Record<string, string | null> | null;
        accountSkills = (skillsData ?? []).map((item) => item.skill).filter(Boolean);
      }

      if (!active) return;
      const stored = localProfile ?? defaultProfile;
      const accountName = accountProfile?.full_name || (typeof user?.user_metadata.full_name === "string" ? user.user_metadata.full_name : "") || stored.personal.fullName;

      setProfile({
        ...stored,
        personal: {
          ...stored.personal,
          fullName: stored.personal.fullName || accountName,
          email: stored.personal.email || accountProfile?.email || user?.email || "",
          phone: stored.personal.phone || accountProfile?.phone || "",
          location: stored.personal.location || accountProfile?.location || "",
          linkedin: stored.personal.linkedin || accountProfile?.linkedin || "",
          github: stored.personal.github || accountProfile?.github || "",
          portfolio: stored.personal.portfolio || accountProfile?.portfolio || "",
        },
        professionalSummary: stored.professionalSummary || accountProfile?.professional_summary || "",
        skills: stored.skills.length ? stored.skills : accountSkills,
      });
      setLoading(false);
      } catch {
        if (!active) return;
        setProfile(localProfile ?? defaultProfile);
        setLoading(false);
        setMessage("Your browser profile is available. Account sync is currently unavailable.");
      }
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  function updatePersonal(field: keyof MasterProfile["personal"], value: string) {
    setProfile((current) => ({ ...current, personal: { ...current.personal, [field]: value } }));
  }
  function updateEducation(id: string, field: keyof Education, value: string) {
    setProfile((current) => ({ ...current, education: current.education.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  }
  function updateExperience(id: string, field: keyof Experience, value: string | boolean) {
    setProfile((current) => ({ ...current, experience: current.experience.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  }
  function updateProject(id: string, field: keyof Project, value: string | string[]) {
    setProfile((current) => ({ ...current, projects: current.projects.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  }
  function updateCertification(id: string, field: keyof Certification, value: string) {
    setProfile((current) => ({ ...current, certifications: current.certifications.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  }
  function updateAchievement(id: string, field: keyof Achievement, value: string) {
    setProfile((current) => ({ ...current, achievements: current.achievements.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  }

  function addEducation() { setProfile((current) => ({ ...current, education: [...current.education, { id: createId(), degree: "", institution: "", location: "", startDate: "", endDate: "", grade: "", description: "" }] })); }
  function addExperience() { setProfile((current) => ({ ...current, experience: [...current.experience, { id: createId(), company: "", position: "", location: "", startDate: "", endDate: "", current: false, description: "" }] })); }
  function addProject() { setProfile((current) => ({ ...current, projects: [...current.projects, { id: createId(), name: "", description: "", technologies: [], link: "" }] })); }
  function addCertification() { setProfile((current) => ({ ...current, certifications: [...current.certifications, { id: createId(), name: "", issuer: "", date: "", credentialUrl: "" }] })); }
  function addAchievement() { setProfile((current) => ({ ...current, achievements: [...current.achievements, { id: createId(), title: "", description: "" }] })); }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    saveProfile(profile);
    if (getLocalDemoUser()) {
      setSaving(false);
      setMessage("Your master profile was saved in this local workspace.");
      return;
    }

    try {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      setSaving(false);
      setMessage("Your master profile was saved on this device.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id, full_name: profile.personal.fullName.trim(), email: profile.personal.email.trim() || user.email,
      phone: profile.personal.phone.trim(), location: profile.personal.location.trim(), linkedin: profile.personal.linkedin.trim(),
      github: profile.personal.github.trim(), portfolio: profile.personal.portfolio.trim(),
      professional_summary: profile.professionalSummary.trim(), updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    let syncError = profileError;
    if (!syncError) {
      const { error: removeSkillsError } = await supabase.from("profile_skills").delete().eq("user_id", user.id);
      syncError = removeSkillsError;
      const skills = profile.skills.map((skill) => skill.trim()).filter(Boolean);
      if (!syncError && skills.length) {
        const { error: saveSkillsError } = await supabase.from("profile_skills").insert(skills.map((skill) => ({ user_id: user.id, skill })));
        syncError = saveSkillsError;
      }
    }

    setSaving(false);
    setMessage(syncError ? "Profile saved on this device. Account sync will retry next time you save." : "Profile saved and account details synced.");
    window.setTimeout(() => setMessage(""), 3500);
    } catch {
      setSaving(false);
      setMessage("Profile saved on this device. Account sync is currently unavailable.");
    }
  }

  const completionParts = [profile.personal.fullName, profile.personal.email, profile.personal.phone, profile.personal.location, profile.professionalSummary, profile.skills.length ? "skills" : "", profile.education.length ? "education" : "", profile.experience.length ? "experience" : "", profile.projects.length ? "projects" : ""];
  const completion = Math.round((completionParts.filter(Boolean).length / completionParts.length) * 100);

  if (loading) return <main className="grid min-h-[calc(100vh-73px)] place-items-center text-sm text-slate-400">Loading your master profile…</main>;

  return (
    <main className="min-h-[calc(100vh-73px)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-cyan-400">Master profile</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your career foundation</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Add your strongest experience once, then reuse it across every targeted resume.</p></div>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving…" : "Save profile"}</button>
        </header>
        <section className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
          <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Profile completeness</p><p className="mt-1 text-xs text-slate-400">Aim for 70% before creating your first tailored resume.</p></div><span className="text-xl font-bold text-cyan-300">{completion}%</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/25"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${completion}%` }} /></div>
        </section>
        {message && <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}

        <div className="mt-6 space-y-6">
          <Panel title="Personal information" description="Contact details used in your resume heading. Your contact email can differ from your account email.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" value={profile.personal.fullName} onChange={(value) => updatePersonal("fullName", value)} placeholder="Your name" />
              <Field label="Contact email" type="email" value={profile.personal.email} onChange={(value) => updatePersonal("email", value)} placeholder="you@example.com" />
              <Field label="Phone" value={profile.personal.phone} onChange={(value) => updatePersonal("phone", value)} placeholder="+91 00000 00000" />
              <Field label="Location" value={profile.personal.location} onChange={(value) => updatePersonal("location", value)} placeholder="City, State" />
              <Field label="LinkedIn URL" value={profile.personal.linkedin} onChange={(value) => updatePersonal("linkedin", value)} placeholder="linkedin.com/in/your-name" />
              <Field label="GitHub URL" value={profile.personal.github} onChange={(value) => updatePersonal("github", value)} placeholder="github.com/your-name" />
              <div className="md:col-span-2"><Field label="Portfolio URL" value={profile.personal.portfolio} onChange={(value) => updatePersonal("portfolio", value)} placeholder="yourportfolio.com" /></div>
            </div>
          </Panel>

          <Panel title="Professional summary" description="A concise snapshot of the direction and strengths you want recruiters to see first."><TextField value={profile.professionalSummary} onChange={(value) => setProfile((current) => ({ ...current, professionalSummary: value }))} placeholder="Example: Computer science student with experience building data-driven web applications…" rows={5} /></Panel>
          <Panel title="Skills" description="Use clear, searchable skill names and separate them with commas."><Field value={profile.skills.join(", ")} onChange={(value) => setProfile((current) => ({ ...current, skills: value.split(",").map((skill) => skill.trim()).filter(Boolean) }))} placeholder="Python, SQL, React, Machine Learning" />{profile.skills.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-slate-200">{skill}</span>)}</div>}</Panel>

          <Panel title="Education" description="Include the education that supports your target role." action="Add education" onAction={addEducation}>
            <div className="space-y-4">{profile.education.map((item) => <EntryCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, education: current.education.filter((entry) => entry.id !== item.id) }))}><div className="grid gap-4 md:grid-cols-2"><Field label="Degree / program" value={item.degree} onChange={(value) => updateEducation(item.id, "degree", value)} /><Field label="Institution" value={item.institution} onChange={(value) => updateEducation(item.id, "institution", value)} /><Field label="Location" value={item.location} onChange={(value) => updateEducation(item.id, "location", value)} /><Field label="Grade / CGPA" value={item.grade} onChange={(value) => updateEducation(item.id, "grade", value)} /><Field label="Start date" value={item.startDate} onChange={(value) => updateEducation(item.id, "startDate", value)} placeholder="Aug 2022" /><Field label="End date" value={item.endDate} onChange={(value) => updateEducation(item.id, "endDate", value)} placeholder="May 2026" /><div className="md:col-span-2"><LabeledText label="Highlights (optional)" value={item.description} onChange={(value) => updateEducation(item.id, "description", value)} /></div></div></EntryCard>)}{!profile.education.length && <Empty text="No education added yet." />}</div>
          </Panel>

          <Panel title="Experience" description="Use outcome-focused bullet points. Separate bullets with a new line." action="Add experience" onAction={addExperience}>
            <div className="space-y-4">{profile.experience.map((item) => <EntryCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, experience: current.experience.filter((entry) => entry.id !== item.id) }))}><div className="grid gap-4 md:grid-cols-2"><Field label="Company" value={item.company} onChange={(value) => updateExperience(item.id, "company", value)} /><Field label="Role / position" value={item.position} onChange={(value) => updateExperience(item.id, "position", value)} /><Field label="Location" value={item.location} onChange={(value) => updateExperience(item.id, "location", value)} /><Field label="Start date" value={item.startDate} onChange={(value) => updateExperience(item.id, "startDate", value)} placeholder="Jun 2025" /><Field label="End date" value={item.endDate} onChange={(value) => updateExperience(item.id, "endDate", value)} placeholder="Present or Aug 2025" /><label className="flex items-center gap-3 pt-7 text-sm text-slate-300"><input type="checkbox" checked={item.current} onChange={(event) => updateExperience(item.id, "current", event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black/30 accent-cyan-400" />I currently work here</label><div className="md:col-span-2"><LabeledText label="Achievements and responsibilities" value={item.description} onChange={(value) => updateExperience(item.id, "description", value)} /></div></div></EntryCard>)}{!profile.experience.length && <Empty text="No experience added yet. Internships, freelance work, and volunteering all count." />}</div>
          </Panel>

          <Panel title="Projects" description="Show work that proves the skills most relevant to your target roles." action="Add project" onAction={addProject}>
            <div className="space-y-4">{profile.projects.map((item) => <EntryCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, projects: current.projects.filter((entry) => entry.id !== item.id) }))}><div className="grid gap-4 md:grid-cols-2"><Field label="Project name" value={item.name} onChange={(value) => updateProject(item.id, "name", value)} /><Field label="Project URL" value={item.link} onChange={(value) => updateProject(item.id, "link", value)} placeholder="github.com/…" /><div className="md:col-span-2"><Field label="Technologies" value={item.technologies.join(", ")} onChange={(value) => updateProject(item.id, "technologies", value.split(",").map((technology) => technology.trim()).filter(Boolean))} placeholder="React, TypeScript, Supabase" /></div><div className="md:col-span-2"><LabeledText label="What you built and the result" value={item.description} onChange={(value) => updateProject(item.id, "description", value)} /></div></div></EntryCard>)}{!profile.projects.length && <Empty text="No projects added yet." />}</div>
          </Panel>

          <Panel title="Certifications" description="Add certifications that are current and relevant to the roles you want." action="Add certification" onAction={addCertification}>
            <div className="space-y-4">{profile.certifications.map((item) => <EntryCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, certifications: current.certifications.filter((entry) => entry.id !== item.id) }))}><div className="grid gap-4 md:grid-cols-2"><Field label="Certification name" value={item.name} onChange={(value) => updateCertification(item.id, "name", value)} /><Field label="Issuer" value={item.issuer} onChange={(value) => updateCertification(item.id, "issuer", value)} /><Field label="Date" value={item.date} onChange={(value) => updateCertification(item.id, "date", value)} placeholder="Jan 2026" /><Field label="Credential URL" value={item.credentialUrl} onChange={(value) => updateCertification(item.id, "credentialUrl", value)} /></div></EntryCard>)}{!profile.certifications.length && <Empty text="No certifications added yet." />}</div>
          </Panel>

          <Panel title="Achievements" description="Add awards, leadership, competitive wins, or other proof of impact." action="Add achievement" onAction={addAchievement}>
            <div className="space-y-4">{profile.achievements.map((item) => <EntryCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, achievements: current.achievements.filter((entry) => entry.id !== item.id) }))}><div className="grid gap-4"><Field label="Title" value={item.title} onChange={(value) => updateAchievement(item.id, "title", value)} /><LabeledText label="Description" value={item.description} onChange={(value) => updateAchievement(item.id, "description", value)} /></div></EntryCard>)}{!profile.achievements.length && <Empty text="No achievements added yet." />}</div>
          </Panel>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:flex-row"><p className="text-sm text-slate-400">Save before creating or refreshing a resume.</p><button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">{saving ? "Saving…" : "Save profile"}</button></div>
      </div>
    </main>
  );
}

function Panel({ title, description, action, onAction, children }: { title: string; description: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>{action && <button type="button" onClick={onAction} className="shrink-0 rounded-lg border border-cyan-400/30 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10">+ {action}</button>}</div><div className="mt-6">{children}</div></section>;
}
function EntryCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">{children}<button type="button" onClick={onDelete} className="mt-5 text-sm font-semibold text-red-300 transition hover:text-red-200">Remove entry</button></div>;
}
function Field({ label, value, onChange, placeholder, type = "text" }: { label?: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block">{label && <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70" /></label>;
}
function LabeledText({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">{label}</span><TextField value={value} onChange={onChange} /></label>;
}
function TextField({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} placeholder={placeholder} className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70" />;
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">{text}</p>;
}
