import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listInvites } from "@/lib/invites";
import { listUsers, getStats } from "@/lib/admin";
import AdminControls from "./AdminControls";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 900,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

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
    <main style={wrap}>
      <Link href="/" style={{ color: "#666", fontSize: 14 }}>
        ← 홈
      </Link>
      <h1>🛡️ 관리자</h1>
      <AdminControls
        invites={invites}
        users={users}
        stats={stats}
        isSuper={user.role === "super"}
        meId={user.id}
      />
    </main>
  );
}
