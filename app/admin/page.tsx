import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listInvites } from "@/lib/invites";
import { listUsers, getStats } from "@/lib/admin";
import AdminControls from "./AdminControls";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "super") redirect("/");

  const [invites, users, stats] = await Promise.all([
    listInvites(),
    listUsers(),
    getStats(),
  ]);

  return (
    <AdminControls
      invites={invites}
      users={users}
      stats={stats}
      isSuper={user.role === "super"}
      meId={user.id}
    />
  );
}
