import {
  MasterProfile,
  ResumePilotSettings,
} from "../types/resume";

export const defaultProfile: MasterProfile = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },

  professionalSummary: "",

  skills: [],

  education: [],

  experience: [],

  projects: [],

  certifications: [],

  achievements: [],
};

export const defaultSettings: ResumePilotSettings = {
  defaultTemplate: "modern",
  defaultLayout: "balanced",
  autoSave: true,
  notifications: true,
};