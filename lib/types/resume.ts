export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export interface MasterProfile {
  personal: PersonalInfo;
  professionalSummary: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
}

export interface Resume {
  id: string;
  title: string;
  targetRole: string;
  jobDescription: string;
  template: ResumeTemplate;
  accent: string;
  layout: "compact" | "balanced" | "spacious";
  profile: MasterProfile;
  createdAt: string;
  updatedAt: string;
}

export interface ResumePilotUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface ResumePilotSettings {
  defaultTemplate: ResumeTemplate;
  defaultLayout: "compact" | "balanced" | "spacious";
  autoSave: boolean;
  notifications: boolean;
}

export type ResumeTemplate =
  | "modern"
  | "professional"
  | "minimal"
  | "executive"
  | "sidebar"
  | "creative";
