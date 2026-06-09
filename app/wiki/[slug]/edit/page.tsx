import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug } from "@/lib/pages";
import PageEditor from "../../PageEditor";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <main style={wrap}>
      <h1 style={{ marginBottom: 16 }}>문서 수정</h1>
      <PageEditor
        mode="edit"
        pageId={page.id}
        initialTitle={page.title}
        initialContent={page.content}
      />
    </main>
  );
}
