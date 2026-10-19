import type { ResumeTemplate } from "@/lib/types/resume";

export type ResumeTemplateOption = {
  id: ResumeTemplate;
  label: string;
  description: string;
  category: "ATS-first" | "Visual";
};

export const resumeTemplates: ResumeTemplateOption[] = [
  {
    id: "modern",
    label: "Modern",
    description: "Clean hierarchy with a focused accent.",
    category: "ATS-first",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Centered, traditional, and recruiter-friendly.",
    category: "ATS-first",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Quiet serif typography with generous space.",
    category: "ATS-first",
  },
  {
    id: "executive",
    label: "Executive",
    description: "Confident header and refined business structure.",
    category: "ATS-first",
  },
  {
    id: "sidebar",
    label: "Sidebar",
    description: "Skills and contact details in a concise left rail.",
    category: "Visual",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Bold color blocks for design-forward applications.",
    category: "Visual",
  },
];

export function getTemplateOption(template: ResumeTemplate) {
  return resumeTemplates.find((option) => option.id === template) ?? resumeTemplates[0];
}
