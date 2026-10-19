import { getLocalDemoUser } from "@/lib/auth/local-demo";
import { createClient } from "@/lib/supabase/client";
import { Resume } from "@/lib/types/resume";

export async function syncResumeDraft(resume: Resume) {
  if (getLocalDemoUser()) return;

  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return;

  const { error } = await supabase.from("resume_drafts").upsert({
    id: resume.id,
    owner_id: authData.user.id,
    title: resume.title,
    target_role: resume.targetRole,
    resume_data: resume,
    created_at: resume.createdAt,
    updated_at: resume.updatedAt,
  });

  if (error) throw error;
}

export async function deleteSyncedResumeDraft(id: string) {
  if (getLocalDemoUser()) return;

  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return;

  const { error } = await supabase
    .from("resume_drafts")
    .delete()
    .eq("id", id)
    .eq("owner_id", authData.user.id);

  if (error) throw error;
}
