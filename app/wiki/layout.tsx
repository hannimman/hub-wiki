import { getCurrentUser } from "@/lib/auth";
import { listTree, listTrash } from "@/lib/pages";
import WikiSidebar from "./WikiSidebar";

export const dynamic = "force-dynamic";

// 위키 전 영역 2-pane: 좌측 트리 사이드바 + 우측 본문(children).
export default async function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  // 미로그인은 각 페이지가 /login 으로 redirect 하므로 사이드바 없이 통과시킨다.
  if (!user) return <>{children}</>;

  // 트리는 "공개 + 내 비공개 글(🔒)" — 남의 비공개 글은 안 보인다
  const [tree, trash] = await Promise.all([listTree(user.id), listTrash()]);
  const nodes = tree.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    parent_id: n.parent_id,
    is_folder: n.is_folder,
    is_private: n.is_private,
  }));
  return (
    <div className="wiki-shell">
      <WikiSidebar nodes={nodes} trashCount={trash.length} />
      <div className="wiki-content">{children}</div>
    </div>
  );
}
