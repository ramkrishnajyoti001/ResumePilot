import { MasterProfile, Resume } from "../types/resume";

const STOP_WORDS = new Set([
  "the","and","for","with","from","that","this","have","has","are","you","your","our","will","can","should","into","about","using","use","work","working","role","job","team","teams","their","they","them","who","what","when","where","how","why","all","any","but","not","than","then","also","more","some","such","each","other","our","we","a","an","to","of","in","on","at","by","as","is","be","or","it","if","i","me","my","do","does","did","must","may","able","years","year","experience","skills","knowledge","including","etc","preferred","required","requirements","responsibilities"
]);

const KNOWN_PHRASES = [
  "machine learning", "deep learning", "artificial intelligence", "data analysis", "data science",
  "computer vision", "natural language processing", "scikit-learn", "tensorflow", "pytorch",
  "power bi", "problem solving", "model evaluation", "feature engineering", "time series",
  "object oriented programming", "computer networks", "operating systems", "database management",
  "sql", "python", "java", "javascript", "typescript", "c++", "c", "git", "github", "docker",
  "pandas", "numpy", "matplotlib", "flask", "react", "next.js", "nextjs", "tailwind", "aws", "azure"
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function profileText(profile: MasterProfile) {
  return normalize([
    profile.professionalSummary,
    profile.skills.join(" "),
    ...profile.education.map(x => `${x.degree} ${x.institution} ${x.description}`),
    ...profile.experience.map(x => `${x.position} ${x.company} ${x.description}`),
    ...profile.projects.map(x => `${x.name} ${x.description} ${x.technologies.join(" ")}`),
    ...profile.certifications.map(x => `${x.name} ${x.issuer}`),
    ...profile.achievements.map(x => `${x.title} ${x.description}`),
  ].join(" "));
}

export function extractKeywords(text: string, limit = 20) {
  const normalized = normalize(text);
  const phrases = KNOWN_PHRASES.filter(p => normalized.includes(p));
  const words = normalized.split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  const frequent = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([w]) => w);
  return [...new Set([...phrases, ...frequent])].slice(0, limit);
}

export function scoreResume(resume: Resume) {
  const p = resume.profile;
  const checks = [
    ["Contact Information", Boolean(p.personal.fullName && p.personal.email && p.personal.phone)],
    ["Professional Summary", p.professionalSummary.trim().length >= 40],
    ["Skills", p.skills.length >= 5],
    ["Experience", p.experience.length > 0],
    ["Education", p.education.length > 0],
    ["Projects", p.projects.length > 0],
    ["Certifications", p.certifications.length > 0],
  ] as const;
  const sectionScores = checks.map(([name, ok]) => ({ name, score: ok ? 100 : 35 }));
  const completeness = Math.round(sectionScores.reduce((s,x) => s + x.score, 0) / sectionScores.length);
  const text = profileText(p);
  const keywords = extractKeywords(resume.jobDescription || resume.targetRole || "", 20);
  const matched = keywords.filter(k => text.includes(k));
  const keywordScore = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 70;
  const lengthScore = text.length >= 350 ? 100 : text.length >= 180 ? 75 : 45;
  const score = Math.round(completeness * 0.55 + keywordScore * 0.3 + lengthScore * 0.15);
  return { score: Math.max(0, Math.min(100, score)), sectionScores, keywords, matchedKeywords: matched, missingKeywords: keywords.filter(k => !text.includes(k)) };
}

export function matchResume(resume: Resume, jobDescription: string) {
  const text = profileText(resume.profile);
  const required = extractKeywords(jobDescription, 20);
  const matched = required.filter(k => text.includes(k));
  const missing = required.filter(k => !text.includes(k));
  const score = required.length ? Math.round((matched.length / required.length) * 100) : 0;
  return { score, required, matched, missing };
}
