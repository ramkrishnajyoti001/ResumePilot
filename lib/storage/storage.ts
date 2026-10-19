import {
  MasterProfile,
  Resume,
  ResumePilotSettings,
  ResumePilotUser,
} from "../types/resume";

const KEYS = {
  USER: "resumepilot_user",
  PROFILE: "resumepilot_profile",
  RESUMES: "resumepilot_resumes",
  SETTINGS: "resumepilot_settings",
  CURRENT_RESUME: "resumepilot_current_resume",
  SESSION: "resumepilot_session",
  ANALYSES: "resumepilot_analyses",
  MATCHES: "resumepilot_matches",
};

function isBrowser() {
  return typeof window !== "undefined";
}

/* ================= USER ================= */

export function saveUser(user: ResumePilotUser) {
  if (!isBrowser()) return;

  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function getUser(): ResumePilotUser | null {
  if (!isBrowser()) return null;

  const data = localStorage.getItem(KEYS.USER);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearUser() {
  if (!isBrowser()) return;

  localStorage.removeItem(KEYS.USER);
}

/* ================= SESSION ================= */

export function createSession(userId: string) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.SESSION,
    JSON.stringify({
      userId,
      loggedIn: true,
      createdAt: new Date().toISOString(),
    })
  );
}

export function isLoggedIn(): boolean {
  if (!isBrowser()) return false;

  const session = localStorage.getItem(KEYS.SESSION);

  if (!session) return false;

  try {
    const parsed = JSON.parse(session);

    return parsed.loggedIn === true;
  } catch {
    return false;
  }
}

export function getSession(): {
  userId: string;
  loggedIn: boolean;
  createdAt: string;
} | null {
  if (!isBrowser()) return null;

  const session = localStorage.getItem(KEYS.SESSION);

  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function logout() {
  if (!isBrowser()) return;

  localStorage.removeItem(KEYS.SESSION);
}

/* ================= PROFILE ================= */

export function saveProfile(profile: MasterProfile) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.PROFILE,
    JSON.stringify(profile)
  );
}

export function getProfileCompletion(): number {
  const profile = getProfile();
  if (!profile) return 0;
  const fields = [
    profile.personal.fullName, profile.personal.email, profile.personal.phone, profile.personal.location,
    profile.personal.linkedin, profile.personal.github, profile.personal.portfolio, profile.professionalSummary,
    profile.skills, profile.education, profile.experience, profile.projects, profile.certifications, profile.achievements,
  ];
  const completed = fields.filter(v => Array.isArray(v) ? v.length > 0 : String(v || '').trim().length > 0).length;
  return Math.round((completed / fields.length) * 100);
}

export function getProfile(): MasterProfile | null {
  if (!isBrowser()) return null;

  const data = localStorage.getItem(KEYS.PROFILE);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/* ================= RESUMES ================= */

export function getResumes(): Resume[] {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(KEYS.RESUMES);

  if (!data) return [];

  try {
    const resumes = JSON.parse(data);

    return Array.isArray(resumes) ? resumes : [];
  } catch {
    return [];
  }
}

export function saveResumes(resumes: Resume[]) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.RESUMES,
    JSON.stringify(resumes)
  );
}

export function saveResume(resume: Resume) {
  const resumes = getResumes();

  const existingIndex = resumes.findIndex(
    (item) => item.id === resume.id
  );

  if (existingIndex >= 0) {
    resumes[existingIndex] = resume;
  } else {
    resumes.unshift(resume);
  }

  saveResumes(resumes);
}

export function getResume(id: string): Resume | null {
  const resumes = getResumes();

  return (
    resumes.find((resume) => resume.id === id) ?? null
  );
}

export function deleteResume(id: string) {
  const resumes = getResumes().filter(
    (resume) => resume.id !== id
  );

  saveResumes(resumes);

  const current = getCurrentResume();
  if (current?.id === id) {
    if (resumes[0]) {
      saveCurrentResume(resumes[0]);
    } else {
      clearCurrentResume();
    }
  }
}

/* ================= CURRENT RESUME ================= */

export function saveCurrentResume(resume: Resume) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.CURRENT_RESUME,
    JSON.stringify(resume)
  );
}

export function getCurrentResume(): Resume | null {
  if (!isBrowser()) return null;

  const data = localStorage.getItem(
    KEYS.CURRENT_RESUME
  );

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearCurrentResume() {
  if (!isBrowser()) return;

  localStorage.removeItem(KEYS.CURRENT_RESUME);
}

/* ================= SETTINGS ================= */

export function saveSettings(
  settings: ResumePilotSettings
) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.SETTINGS,
    JSON.stringify(settings)
  );
}

export function getSettings(): ResumePilotSettings | null {
  if (!isBrowser()) return null;

  const data = localStorage.getItem(KEYS.SETTINGS);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}


export interface StoredAnalysis {
  resumeId: string;
  score: number;
  keywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  analyzedAt: string;
}

export interface StoredMatch {
  resumeId: string;
  score: number;
  matched: string[];
  missing: string[];
  jobDescription: string;
  analyzedAt: string;
}

export function getAnalyses(): StoredAnalysis[] {
  if (!isBrowser()) return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEYS.ANALYSES) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function saveAnalysis(analysis: StoredAnalysis) {
  if (!isBrowser()) return;
  const items = getAnalyses().filter(x => x.resumeId !== analysis.resumeId);
  items.unshift(analysis);
  localStorage.setItem(KEYS.ANALYSES, JSON.stringify(items));
}

export function getMatches(): StoredMatch[] {
  if (!isBrowser()) return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEYS.MATCHES) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function saveMatch(match: StoredMatch) {
  if (!isBrowser()) return;
  const items = getMatches().filter(x => x.resumeId !== match.resumeId);
  items.unshift(match);
  localStorage.setItem(KEYS.MATCHES, JSON.stringify(items));
}

export function getLatestMatch(): StoredMatch | null {
  return getMatches()[0] ?? null;
}

/* ================= RESET ================= */

export function clearResumePilotData() {
  if (!isBrowser()) return;

  Object.values(KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}