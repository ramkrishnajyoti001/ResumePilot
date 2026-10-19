import {
  createSession,
  getUser,
  isLoggedIn,
  logout,
  saveUser,
} from "@/lib/storage/storage";
import { ResumePilotUser } from "@/lib/types/resume";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Allows the complete browser-local workspace to be tried during local
 * development when the hosted authentication service is unavailable.
 * This is never enabled in a production build.
 */
export function canUseLocalDemo() {
  return (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    LOCAL_HOSTS.has(window.location.hostname)
  );
}

export function getLocalDemoUser(): ResumePilotUser | null {
  if (!canUseLocalDemo() || !isLoggedIn()) return null;

  return getUser();
}

export function startLocalDemoSession(details: {
  name?: string;
  email?: string;
} = {}): ResumePilotUser | null {
  if (!canUseLocalDemo()) return null;

  const existing = getUser();
  const user: ResumePilotUser = {
    id: existing?.id ?? `local-${Date.now()}`,
    name: details.name?.trim() || existing?.name || "Local user",
    email:
      details.email?.trim().toLowerCase() ||
      existing?.email ||
      "local@resumepilot.test",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  saveUser(user);
  createSession(user.id);

  return user;
}

export function endLocalDemoSession() {
  if (!canUseLocalDemo()) return;

  logout();
}
