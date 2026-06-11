import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug, listParentOptions, canViewPage } from "@/lib/pages";
import { getRatingsEnabled } from "@/lib/ratings";
import PageEditor from "../../PageEditor";

export const dynamic = "force-dynamic";

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
  if (!canViewPage(page, user.id)) notFound(); // 비공개 글은 작성자만
  const ratingsAllowed = await getRatingsEnabled();
  // 자기 자신과 하위 문서는 상위 폴더 후보에서 제외(순환 방지)
  const parentOptions = await listParentOptions(page.id);

  return (
    <main className="container page">
      <h1 style={{ marginBottom: 16 }}>문서 수정</h1>
      <PageEditor
        mode="edit"
        pageId={page.id}
        baseRevisionId={page.current_revision_id}
        initialTitle={page.title}
        initialContent={page.content}
        ratingsAllowed={ratingsAllowed}
        initialRatingsEnabled={page.ratings_enabled}
        parentOptions={parentOptions}
        initialParentId={page.parent_id}
      />
    </main>
  );
}
