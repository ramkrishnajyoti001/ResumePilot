import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ResumePilot | Build resumes that match the role",
    template: "%s | ResumePilot",
  },
  description:
    "Create, tailor, analyze, and keep track of job-ready resumes in one focused workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
