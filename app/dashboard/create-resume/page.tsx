"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProfile,
  getSettings,
  getResume,
  saveCurrentResume,
  saveResume,
} from "../../../lib/storage/storage";
import { defaultProfile } from "../../../lib/data/defaults";
import { MasterProfile, Resume, ResumeTemplate } from "../../../lib/types/resume";
import { resumeTemplates } from "@/lib/resume/templates";

type Layout = "compact" | "balanced" | "spacious";

const accents = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#dc2626",
  "#0891b2",
  "#111827",
];

export default function CreateResumePage() {
  const router = useRouter();

  const [title, setTitle] = useState("My Resume");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [template, setTemplate] = useState<ResumeTemplate>("modern");
  const [layout, setLayout] = useState<Layout>("balanced");
  const [accent, setAccent] = useState("#2563eb");

  const [profile, setProfile] = useState<MasterProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedProfile = getProfile();
      const savedSettings = getSettings();
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const existing = id ? getResume(id) : null;

      if (existing) {
      // Editing: load the saved resume exactly as it was saved.
      // Do not overwrite it with Master Profile or Settings defaults.
      setEditingId(existing.id);
      setTitle(existing.title);
      setTargetRole(existing.targetRole);
      setJobDescription(existing.jobDescription);
      setTemplate(existing.template);
      setLayout(existing.layout);
      setAccent(existing.accent);
      setProfile(existing.profile);
      } else {
      // Creating: start from the current Master Profile and saved defaults.
      if (savedProfile) setProfile(savedProfile);
      if (savedSettings) {
        setTemplate(savedSettings.defaultTemplate);
        setLayout(savedSettings.defaultLayout);
      }
      }

      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const createResume = () => {
    setSaving(true);

    const now = new Date().toISOString();

    const resume: Resume = {
      id: editingId || crypto.randomUUID(),
      title: title.trim() || "My Resume",
      targetRole: targetRole.trim(),
      jobDescription: jobDescription.trim(),
      template,
      accent,
      layout,
      profile,
      createdAt: editingId ? (getResume(editingId)?.createdAt || now) : now,
      updatedAt: now,
    };

    saveResume(resume);
    saveCurrentResume(resume);

    setTimeout(() => {
      router.push("/dashboard/preview");
    }, 300);
  };

  const profileName =
    profile.personal.fullName.trim() || "Your Name";

  const profileSkills =
    profile.skills.length > 0
      ? profile.skills.slice(0, 6)
      : ["Add skills from Master Profile"];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-sm text-gray-400">
          Loading ResumePilot...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-5 text-sm text-gray-400 hover:text-white"
          >
            ← Back to Dashboard
          </button>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Create Resume
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Build a role-specific resume from your Master Profile.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* LEFT */}
          <section className="space-y-6">
            {/* Resume details */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold">
                Resume Details
              </h2>

              <div className="mt-5 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Resume Title
                  </label>

                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Machine Learning Intern Resume"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Target Role
                  </label>

                  <input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Machine Learning Intern"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Job Description
                  </label>

                  <textarea
                    value={jobDescription}
                    onChange={(e) =>
                      setJobDescription(e.target.value)
                    }
                    rows={8}
                    placeholder="Paste the job description here..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-white/30"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Adding the job description will allow ResumePilot to
                    optimize the resume for the target role later.
                  </p>
                </div>
              </div>
            </div>

            {/* Template */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold">
                Template
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {resumeTemplates.map(
                  (item) => {
                    const selected = template === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setTemplate(item.id)}
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-white/40 bg-white/10"
                            : "border-white/10 bg-black/20 hover:border-white/20"
                        }`}
                      >
                        <TemplateThumbnail template={item.id} accent={accent} />

                        <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{item.label}</p><span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">{item.category}</span></div>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.description}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Layout */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold">
                Layout
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(["compact", "balanced", "spacious"] as Layout[]).map(
                  (item) => {
                    const selected = layout === item;

                    return (
                      <button
                        key={item}
                        onClick={() => setLayout(item)}
                        className={`rounded-xl border px-4 py-4 text-left capitalize transition ${
                          selected
                            ? "border-white/40 bg-white/10"
                            : "border-white/10 bg-black/20 hover:border-white/20"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {item}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {item === "compact"
                            ? "More content per page"
                            : item === "balanced"
                            ? "Recommended spacing"
                            : "More breathing room"}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Accent */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold">
                Accent Color
              </h2>

              <div className="mt-5 flex flex-wrap gap-3">
                {accents.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccent(color)}
                    className={`h-10 w-10 rounded-full border-2 transition ${
                      accent === color
                        ? "border-white scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Generate */}
            <button
              onClick={createResume}
              disabled={saving}
              className="w-full rounded-xl px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {saving ? (editingId ? "Saving Changes..." : "Creating Resume...") : (editingId ? "Save Changes →" : "Create Resume →")}
            </button>
          </section>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Live Preview
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    {title || "My Resume"}
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  Draft
                </span>
              </div>

              <div className="overflow-hidden rounded-xl bg-white text-black shadow-2xl">
                <div
                  className={`p-6 ${
                    layout === "compact"
                      ? "space-y-3"
                      : layout === "spacious"
                      ? "space-y-7"
                      : "space-y-5"
                  }`}
                >
                  {/* Resume header */}
                  <div>
                    <h1
                      className={`text-2xl font-bold ${
                        template === "minimal"
                          ? "tracking-tight"
                          : ""
                      }`}
                    >
                      {profileName}
                    </h1>

                    <p
                      className="mt-1 text-sm font-medium"
                      style={{ color: accent }}
                    >
                      {targetRole || "Target Role"}
                    </p>

                    <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                      {profile.personal.email || "email@example.com"}
                      {" • "}
                      {profile.personal.phone || "+91 XXXXX XXXXX"}
                      {" • "}
                      {profile.personal.location || "Location"}
                    </p>
                  </div>

                  {/* Summary */}
                  <PreviewSection
                    title="Professional Summary"
                    accent={accent}
                  >
                    <p className="text-[10px] leading-relaxed text-gray-600">
                      {profile.professionalSummary ||
                        "Your professional summary will appear here after you complete your Master Profile."}
                    </p>
                  </PreviewSection>

                  {/* Skills */}
                  <PreviewSection
                    title="Skills"
                    accent={accent}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {profileSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded bg-gray-100 px-2 py-1 text-[9px] text-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </PreviewSection>

                  {/* Education */}
                  <PreviewSection
                    title="Education"
                    accent={accent}
                  >
                    {profile.education.length > 0 ? (
                      profile.education.slice(0, 2).map((edu) => (
                        <div key={edu.id} className="mb-2">
                          <p className="text-[10px] font-semibold">
                            {edu.degree || "Degree"}
                          </p>

                          <p className="text-[9px] text-gray-500">
                            {edu.institution || "Institution"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400">
                        Education will appear here.
                      </p>
                    )}
                  </PreviewSection>

                  {/* Experience */}
                  <PreviewSection
                    title="Experience"
                    accent={accent}
                  >
                    {profile.experience.length > 0 ? (
                      profile.experience.slice(0, 2).map((exp) => (
                        <div key={exp.id} className="mb-3">
                          <p className="text-[10px] font-semibold">
                            {exp.position || "Position"}
                          </p>

                          <p className="text-[9px] text-gray-500">
                            {exp.company || "Company"}
                          </p>

                          {exp.description && (
                            <p className="mt-1 text-[8px] leading-relaxed text-gray-500">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400">
                        Experience will appear here.
                      </p>
                    )}
                  </PreviewSection>

                  {/* Projects */}
                  <PreviewSection
                    title="Projects"
                    accent={accent}
                  >
                    {profile.projects.length > 0 ? (
                      profile.projects.slice(0, 2).map((project) => (
                        <div key={project.id} className="mb-2">
                          <p className="text-[10px] font-semibold">
                            {project.name || "Project"}
                          </p>

                          <p className="text-[8px] leading-relaxed text-gray-500">
                            {project.description ||
                              "Project description"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400">
                        Projects will appear here.
                      </p>
                    )}
                  </PreviewSection>
                </div>
              </div>

              {/* Profile status */}
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Master Profile
                  </span>

                  <span
                    className={`text-xs ${
                      profile.personal.fullName ||
                      profile.skills.length ||
                      profile.education.length
                        ? "text-emerald-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {profile.personal.fullName ||
                    profile.skills.length ||
                    profile.education.length
                      ? "Connected"
                      : "Needs data"}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  This resume will use your saved Master Profile data.
                </p>

                <button
                  onClick={() => router.push("/dashboard/profile")}
                  className="mt-3 text-xs font-medium text-white underline underline-offset-4"
                >
                  Edit Master Profile
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PreviewSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <div
          className="h-3 w-1 rounded-full"
          style={{ backgroundColor: accent }}
        />

        <h3 className="text-[10px] font-bold uppercase tracking-wider">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function TemplateThumbnail({ template, accent }: { template: ResumeTemplate; accent: string }) {
  const line = "h-1.5 rounded bg-gray-200";

  if (template === "sidebar") {
    return <div className="mb-3 grid h-24 grid-cols-[34%_1fr] overflow-hidden rounded-lg bg-white"><div className="p-2.5 text-white" style={{ backgroundColor: accent }}><div className="h-2 w-full rounded bg-white/80" /><div className="mt-3 h-1 w-4/5 rounded bg-white/50" /><div className="mt-2 h-1 w-full rounded bg-white/50" /></div><div className="p-3"><div className="h-2 w-3/5 rounded" style={{ backgroundColor: accent }} /><div className={`mt-3 ${line}`} /><div className={`mt-2 w-4/5 ${line}`} /><div className={`mt-4 w-1/2 ${line}`} /></div></div>;
  }

  if (template === "creative") {
    return <div className="mb-3 h-24 overflow-hidden rounded-lg bg-white"><div className="h-8 p-2.5" style={{ backgroundColor: accent }}><div className="h-2 w-1/2 rounded bg-white/90" /></div><div className="grid grid-cols-2 gap-2 p-3"><div><div className={`w-full ${line}`} /><div className={`mt-2 w-4/5 ${line}`} /></div><div><div className={`w-full ${line}`} /><div className={`mt-2 w-3/5 ${line}`} /></div></div></div>;
  }

  return <div className={`mb-3 h-24 rounded-lg bg-white p-3 ${template === "professional" ? "text-center" : ""} ${template === "minimal" ? "font-serif" : ""}`}><div className={`h-2 rounded ${template === "professional" ? "mx-auto w-1/2" : "w-20"}`} style={{ backgroundColor: accent }} /><div className={`mt-3 ${line}`} /><div className={`mt-2 ${template === "minimal" ? "w-3/5" : "w-4/5"} ${line}`} /><div className={`mt-4 ${template === "executive" ? "h-2 w-full" : "w-16"} rounded`} style={template === "executive" ? { backgroundColor: accent } : undefined} /><div className={`mt-2 ${line}`} /></div>;
}
