import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRatingsEnabled } from "@/lib/ratings";
import PageEditor from "../PageEditor";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { title } = await searchParams;
  const ratingsAllowed = await getRatingsEnabled();

  return (
    <main style={wrap}>
      <h1 style={{ marginBottom: 16 }}>새 문서</h1>
      <PageEditor
        mode="new"
        initialTitle={title ?? ""}
        ratingsAllowed={ratingsAllowed}
        initialRatingsEnabled={ratingsAllowed}
      />
    </main>
  );
}
