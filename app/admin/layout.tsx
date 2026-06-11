import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminTabs from "./AdminTabs";

export const dynamic = "force-dynamic";

// /admin 전 영역 공통: 권한 가드 + 제목 + 탭 네비.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "super") redirect("/");

  return (
    <main className="container page">
      <h1 style={{ marginBottom: 0 }}>🛡️ 관리자</h1>
      <AdminTabs />
      {children}
    </main>
  );
}
