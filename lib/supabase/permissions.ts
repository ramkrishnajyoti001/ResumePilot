import { createClient } from "@/lib/supabase/client";

export type PrivilegedRole = "admin" | "developer";

export function isPrivilegedRole(role: string | null | undefined): role is PrivilegedRole {
  return role === "admin" || role === "developer";
}

export async function getCurrentPrivilegedRole(): Promise<PrivilegedRole | null> {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error || !isPrivilegedRole(data?.role)) return null;

  return data.role;
}
