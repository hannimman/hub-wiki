import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PageEditor from "../PageEditor";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default async function NewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main style={wrap}>
      <h1 style={{ marginBottom: 16 }}>새 문서</h1>
      <PageEditor mode="new" />
    </main>
  );
}
