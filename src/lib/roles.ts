import { auth } from "@/lib/auth/server";

export async function isAdmin(): Promise<boolean> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return admins.includes(session.user.email.toLowerCase());
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized: admin only");
}
