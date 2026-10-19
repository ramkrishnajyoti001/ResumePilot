"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentResume, getResume, saveCurrentResume } from "../../../lib/storage/storage";
import { Resume } from "../../../lib/types/resume";

export default function PreviewPage() {
  const router = useRouter();

  const [resume, setResume] = useState<Resume | null>(null);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const currentResume = (id ? getResume(id) : null) || getCurrentResume();
      if (currentResume) saveCurrentResume(currentResume);
      setResume(currentResume);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <p className="text-sm text-gray-400">
          Loading resume...
        </p>
      </main>
    );
  }

  if (!resume) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h1 className="text-2xl font-semibold">
              No Resume Found
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Create a resume first. Your generated resume will appear
              here automatically.
            </p>

            <button
              onClick={() =>
                router.push("/dashboard/create-resume")
              }
              className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-200"
            >
              Create Resume
            </button>
          </div>
        </div>
      </main>
    );
  }

  const changeZoom = (amount: number) => {
    setZoom((current) =>
      Math.min(150, Math.max(60, current + amount))
    );
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Top Bar */}
      <header className="print-hidden sticky top-0 z-20 border-b border-white/10 bg-[#050505]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-400 hover:text-white"
            >
              ← Dashboard
            </button>

            <div className="h-5 w-px bg-white/10" />

            <div>
              <h1 className="text-sm font-semibold">
                {resume.title}
              </h1>

              <p className="text-xs text-gray-500">
                {resume.targetRole || "Resume Preview"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => changeZoom(-10)}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
            >
              −
            </button>

            <span className="min-w-[50px] text-center text-xs text-gray-400">
              {zoom}%
            </span>

            <button
              onClick={() => changeZoom(10)}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
            >
              +
            </button>

            <button
              onClick={() =>
                router.push(`/dashboard/create-resume?id=${resume.id}`)
              }
              className="ml-2 rounded-lg border border-white/10 px-4 py-2 text-xs hover:bg-white/10"
            >
              Edit
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-black hover:bg-slate-200"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      {/* Preview Area */}
      <div className="resume-print-area min-h-[calc(100vh-73px)] overflow-auto bg-[#111] px-6 py-10">
        <div className="flex justify-center">
          <div
            className="origin-top transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100})`,
              marginBottom: `${(zoom - 100) * 10}px`,
            }}
          >
            <ResumeDocument resume={resume} />
          </div>
        </div>
      </div>
    </main>
  );
}

function ResumeDocument({ resume }: { resume: Resume }) {
  const { profile } = resume;
  const accent = resume.accent || "#2563eb";
  const isExecutive = resume.template === "executive";

  if (resume.template === "sidebar") {
    return <SidebarResumeDocument resume={resume} />;
  }

  if (resume.template === "creative") {
    return <CreativeResumeDocument resume={resume} />;
  }

  return (
    <article
      className={`resume-document min-h-[1123px] w-[794px] bg-white px-[58px] py-[55px] text-black shadow-2xl ${
        resume.layout === "compact"
          ? "py-[42px]"
          : resume.layout === "spacious"
            ? "px-[66px] py-[68px]"
            : ""
      } ${resume.template === "minimal" ? "font-light" : ""} ${isExecutive ? "border-t-[16px]" : ""}`}
      style={{
        fontFamily: resume.template === "minimal" || isExecutive ? "Georgia, serif" : "Arial, Helvetica, sans-serif",
        borderTopColor: isExecutive ? accent : undefined,
      }}
    >
      {/* Header */}
      <header className={`border-b pb-5 ${isExecutive ? "border-gray-900 text-center" : "border-gray-200"} ${resume.template === "professional" ? "text-center" : ""}`}>
        <h1 className={`text-[30px] font-bold tracking-tight ${resume.template === "minimal" || isExecutive ? "font-normal uppercase tracking-[0.08em]" : ""}`}>
          {profile.personal.fullName || "Your Name"}
        </h1>

        {resume.targetRole && (
          <p
            className={`mt-1 text-[15px] font-semibold ${isExecutive ? "uppercase tracking-[0.16em]" : ""}`}
            style={{ color: accent }}
          >
            {resume.targetRole}
          </p>
        )}

        <div className={`mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600 ${resume.template === "professional" || isExecutive ? "justify-center" : ""}`}>
          {profile.personal.email && (
            <span>{profile.personal.email}</span>
          )}

          {profile.personal.phone && (
            <span>• {profile.personal.phone}</span>
          )}

          {profile.personal.location && (
            <span>• {profile.personal.location}</span>
          )}

          {profile.personal.linkedin && (
            <span>• LinkedIn</span>
          )}

          {profile.personal.github && (
            <span>• GitHub</span>
          )}

          {profile.personal.portfolio && (
            <span>• Portfolio</span>
          )}
        </div>
      </header>

      <div className={`mt-5 ${resume.layout === "compact" ? "space-y-3" : resume.layout === "spacious" ? "space-y-7" : "space-y-5"}`}>
        {/* Summary */}
        {profile.professionalSummary && (
          <ResumeSection
            title="Professional Summary"
            accent={accent}
          >
            <p className="text-[11px] leading-[1.6] text-gray-700">
              {profile.professionalSummary}
            </p>
          </ResumeSection>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <ResumeSection
            title="Skills"
            accent={accent}
          >
            <div className="flex flex-wrap gap-x-2 gap-y-1.5">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Experience */}
        {profile.experience.length > 0 && (
          <ResumeSection
            title="Experience"
            accent={accent}
          >
            <div className="space-y-4">
              {profile.experience.map((experience) => (
                <div key={experience.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[12px] font-bold">
                        {experience.position}
                      </h3>

                      <p
                        className="text-[10px] font-semibold"
                        style={{ color: accent }}
                      >
                        {experience.company}
                      </p>

                      {experience.location && (
                        <p className="text-[9px] text-gray-500">
                          {experience.location}
                        </p>
                      )}
                    </div>

                    <p className="whitespace-nowrap text-[9px] text-gray-500">
                      {experience.startDate}
                      {" — "}
                      {experience.current
                        ? "Present"
                        : experience.endDate}
                    </p>
                  </div>

                  {experience.description && (
                    <p className="mt-1.5 whitespace-pre-line text-[10px] leading-[1.55] text-gray-700">
                      {experience.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Education */}
        {profile.education.length > 0 && (
          <ResumeSection
            title="Education"
            accent={accent}
          >
            <div className="space-y-3">
              {profile.education.map((education) => (
                <div key={education.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[12px] font-bold">
                        {education.degree}
                      </h3>

                      <p
                        className="text-[10px] font-semibold"
                        style={{ color: accent }}
                      >
                        {education.institution}
                      </p>

                      {education.location && (
                        <p className="text-[9px] text-gray-500">
                          {education.location}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] text-gray-500">
                        {education.startDate}
                        {" — "}
                        {education.endDate}
                      </p>

                      {education.grade && (
                        <p className="mt-1 text-[9px] font-medium text-gray-600">
                          {education.grade}
                        </p>
                      )}
                    </div>
                  </div>

                  {education.description && (
                    <p className="mt-1 text-[10px] leading-relaxed text-gray-700">
                      {education.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Projects */}
        {profile.projects.length > 0 && (
          <ResumeSection
            title="Projects"
            accent={accent}
          >
            <div className="space-y-3">
              {profile.projects.map((project) => (
                <div key={project.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[12px] font-bold">
                      {project.name}
                    </h3>

                    {project.link && (
                      <span
                        className="text-[9px]"
                        style={{ color: accent }}
                      >
                        Project Link
                      </span>
                    )}
                  </div>

                  {project.technologies.length > 0 && (
                    <p className="mt-0.5 text-[9px] font-medium text-gray-500">
                      {project.technologies.join(" • ")}
                    </p>
                  )}

                  {project.description && (
                    <p className="mt-1 text-[10px] leading-[1.5] text-gray-700">
                      {project.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Certifications */}
        {profile.certifications.length > 0 && (
          <ResumeSection
            title="Certifications"
            accent={accent}
          >
            <div className="space-y-2">
              {profile.certifications.map((certification) => (
                <div
                  key={certification.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div>
                    <h3 className="text-[11px] font-bold">
                      {certification.name}
                    </h3>

                    <p className="text-[9px] text-gray-600">
                      {certification.issuer}
                    </p>
                  </div>

                  {certification.date && (
                    <p className="whitespace-nowrap text-[9px] text-gray-500">
                      {certification.date}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Achievements */}
        {profile.achievements.length > 0 && (
          <ResumeSection
            title="Achievements"
            accent={accent}
          >
            <div className="space-y-2">
              {profile.achievements.map((achievement) => (
                <div key={achievement.id}>
                  <h3 className="text-[11px] font-bold">
                    {achievement.title}
                  </h3>

                  {achievement.description && (
                    <p className="mt-0.5 text-[10px] leading-relaxed text-gray-700">
                      {achievement.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ResumeSection>
        )}
      </div>
    </article>
  );
}

function SidebarResumeDocument({ resume }: { resume: Resume }) {
  const { profile } = resume;
  const accent = resume.accent || "#2563eb";

  return (
    <article className="resume-document grid min-h-[1123px] w-[794px] grid-cols-[218px_1fr] bg-white text-black shadow-2xl" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <aside className="px-6 py-12 text-white" style={{ backgroundColor: accent }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Contact</p>
        <div className="mt-4 space-y-2.5 text-[10px] leading-relaxed text-white/90">
          {profile.personal.email && <p>{profile.personal.email}</p>}
          {profile.personal.phone && <p>{profile.personal.phone}</p>}
          {profile.personal.location && <p>{profile.personal.location}</p>}
          {profile.personal.linkedin && <p>LinkedIn</p>}
          {profile.personal.github && <p>GitHub</p>}
          {profile.personal.portfolio && <p>Portfolio</p>}
        </div>
        {profile.skills.length > 0 && <aside className="mt-10"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Core skills</p><div className="mt-4 flex flex-wrap gap-1.5">{profile.skills.map((skill) => <span key={skill} className="rounded border border-white/25 px-2 py-1 text-[9px] text-white">{skill}</span>)}</div></aside>}
        {profile.certifications.length > 0 && <aside className="mt-10"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Credentials</p><div className="mt-4 space-y-3">{profile.certifications.map((certification) => <div key={certification.id}><p className="text-[10px] font-semibold">{certification.name}</p><p className="mt-0.5 text-[9px] text-white/75">{certification.issuer}</p></div>)}</div></aside>}
      </aside>
      <main className={`px-10 py-12 ${resume.layout === "compact" ? "py-9" : resume.layout === "spacious" ? "px-12 py-16" : ""}`}>
        <header className="border-b-2 border-gray-900 pb-5">
          <h1 className="text-[31px] font-bold tracking-tight">{profile.personal.fullName || "Your Name"}</h1>
          {resume.targetRole && <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>{resume.targetRole}</p>}
        </header>
        <VisualResumeContent resume={resume} includeSkills={false} includeCertifications={false} />
      </main>
    </article>
  );
}

function CreativeResumeDocument({ resume }: { resume: Resume }) {
  const { profile } = resume;
  const accent = resume.accent || "#2563eb";

  return (
    <article className="resume-document min-h-[1123px] w-[794px] overflow-hidden bg-white text-black shadow-2xl" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <header className="px-12 py-10 text-white" style={{ backgroundColor: accent }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Curriculum vitae</p>
        <h1 className="mt-2 text-[34px] font-bold tracking-tight">{profile.personal.fullName || "Your Name"}</h1>
        {resume.targetRole && <p className="mt-1 text-[14px] font-medium text-white/85">{resume.targetRole}</p>}
        <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/80">
          {profile.personal.email && <span>{profile.personal.email}</span>}
          {profile.personal.phone && <span>• {profile.personal.phone}</span>}
          {profile.personal.location && <span>• {profile.personal.location}</span>}
        </div>
      </header>
      <div className={`grid grid-cols-[205px_1fr] ${resume.layout === "compact" ? "" : resume.layout === "spacious" ? "" : ""}`}>
        <aside className="border-r border-gray-200 bg-gray-50 px-6 py-9">
          {profile.skills.length > 0 && <section><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>Skills</p><div className="mt-3 space-y-2">{profile.skills.map((skill) => <p key={skill} className="border-b border-gray-200 pb-1.5 text-[10px] font-medium text-gray-700">{skill}</p>)}</div></section>}
          {profile.personal.linkedin || profile.personal.github || profile.personal.portfolio ? <section className="mt-8"><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>Links</p><div className="mt-3 space-y-2 text-[10px] text-gray-700">{profile.personal.linkedin && <p>LinkedIn</p>}{profile.personal.github && <p>GitHub</p>}{profile.personal.portfolio && <p>Portfolio</p>}</div></section> : null}
          {profile.certifications.length > 0 && <section className="mt-8"><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>Certificates</p><div className="mt-3 space-y-3">{profile.certifications.map((certification) => <div key={certification.id}><p className="text-[10px] font-semibold">{certification.name}</p><p className="mt-0.5 text-[9px] text-gray-500">{certification.issuer}</p></div>)}</div></section>}
        </aside>
        <main className={`px-9 py-9 ${resume.layout === "compact" ? "py-7" : resume.layout === "spacious" ? "px-11 py-12" : ""}`}>
          <VisualResumeContent resume={resume} includeSkills={false} includeCertifications={false} />
        </main>
      </div>
    </article>
  );
}

function VisualResumeContent({ resume, includeSkills, includeCertifications }: { resume: Resume; includeSkills: boolean; includeCertifications: boolean }) {
  const { profile } = resume;
  const accent = resume.accent || "#2563eb";
  const spacing = resume.layout === "compact" ? "space-y-4" : resume.layout === "spacious" ? "space-y-8" : "space-y-6";

  return (
    <div className={`mt-6 ${spacing}`}>
      {profile.professionalSummary && <ResumeSection title="Professional Summary" accent={accent}><p className="text-[10px] leading-[1.6] text-gray-700">{profile.professionalSummary}</p></ResumeSection>}
      {includeSkills && profile.skills.length > 0 && <ResumeSection title="Skills" accent={accent}><div className="flex flex-wrap gap-1.5">{profile.skills.map((skill) => <span key={skill} className="rounded bg-gray-100 px-2 py-1 text-[9px] text-gray-700">{skill}</span>)}</div></ResumeSection>}
      {profile.experience.length > 0 && <ResumeSection title="Experience" accent={accent}><div className="space-y-4">{profile.experience.map((experience) => <div key={experience.id}><div className="flex items-start justify-between gap-4"><div><h3 className="text-[11px] font-bold">{experience.position}</h3><p className="text-[10px] font-semibold" style={{ color: accent }}>{experience.company}</p>{experience.location && <p className="text-[9px] text-gray-500">{experience.location}</p>}</div><p className="whitespace-nowrap text-[9px] text-gray-500">{experience.startDate} — {experience.current ? "Present" : experience.endDate}</p></div>{experience.description && <p className="mt-1.5 whitespace-pre-line text-[10px] leading-[1.55] text-gray-700">{experience.description}</p>}</div>)}</div></ResumeSection>}
      {profile.projects.length > 0 && <ResumeSection title="Projects" accent={accent}><div className="space-y-3">{profile.projects.map((project) => <div key={project.id}><h3 className="text-[11px] font-bold">{project.name}</h3>{project.technologies.length > 0 && <p className="mt-0.5 text-[9px] font-medium text-gray-500">{project.technologies.join(" • ")}</p>}{project.description && <p className="mt-1 text-[10px] leading-[1.5] text-gray-700">{project.description}</p>}</div>)}</div></ResumeSection>}
      {profile.education.length > 0 && <ResumeSection title="Education" accent={accent}><div className="space-y-3">{profile.education.map((education) => <div key={education.id} className="flex items-start justify-between gap-4"><div><h3 className="text-[11px] font-bold">{education.degree}</h3><p className="text-[10px] font-semibold" style={{ color: accent }}>{education.institution}</p>{education.location && <p className="text-[9px] text-gray-500">{education.location}</p>}</div><p className="whitespace-nowrap text-[9px] text-gray-500">{education.startDate} — {education.endDate}</p></div>)}</div></ResumeSection>}
      {includeCertifications && profile.certifications.length > 0 && <ResumeSection title="Certifications" accent={accent}><div className="space-y-2">{profile.certifications.map((certification) => <div key={certification.id} className="flex justify-between gap-4"><div><h3 className="text-[10px] font-bold">{certification.name}</h3><p className="text-[9px] text-gray-600">{certification.issuer}</p></div><p className="text-[9px] text-gray-500">{certification.date}</p></div>)}</div></ResumeSection>}
      {profile.achievements.length > 0 && <ResumeSection title="Achievements" accent={accent}><div className="space-y-2">{profile.achievements.map((achievement) => <div key={achievement.id}><h3 className="text-[10px] font-bold">{achievement.title}</h3>{achievement.description && <p className="mt-0.5 text-[10px] leading-relaxed text-gray-700">{achievement.description}</p>}</div>)}</div></ResumeSection>}
    </div>
  );
}

function ResumeSection({
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
          className="h-3.5 w-1 rounded-full"
          style={{ backgroundColor: accent }}
        />

        <h2
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}
