import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listPages, listRecentChanges } from "@/lib/pages";
import { listUsers } from "@/lib/admin";
import { Avatar } from "@/lib/avatars";
import {
  isV2,
  DEFAULT_AVATAR_V2,
  type AvatarV2Data,
} from "@/lib/avatar/render";
import WikiPlaza, { type PlazaMember } from "./WikiPlaza";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  padding: "28px 28px 72px",
  maxWidth: 860,
};
const searchInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  fontSize: 15,
};

export default async function WikiHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;
  const searching = !!q?.trim();
  // 비공개 글은 작성자 본인에게만 검색/최근변경에 노출
  const results = searching ? await listPages(q, user.id) : [];
  const recent = searching ? [] : await listRecentChanges(user.id);

  // 팀 광장: 활성 멤버 전원 (v2 아바타 아니면 기본 모습으로 산책)
  const members: PlazaMember[] = searching
    ? []
    : (await listUsers())
        .filter((u) => u.is_active)
        .map((u) => ({
          id: u.id,
          name: u.display_name,
          data: isV2(u.avatar_config)
            ? (u.avatar_config as AvatarV2Data)
            : DEFAULT_AVATAR_V2,
        }));

  return (
    <main style={wrap}>
      <h1 style={{ marginTop: 0 }}>📚 위키</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        왼쪽 트리에서 폴더와 문서를 탐색하세요. 폴더는 클릭하면 펼쳐집니다.
      </p>

      {!searching && <WikiPlaza members={members} />}

      <form action="/wiki" method="get" style={{ margin: "16px 0" }}>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="제목·본문 검색…"
          style={searchInput}
        />
      </form>

      {searching ? (
        results.length === 0 ? (
          <p className="muted">검색 결과가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {results.map((p) => (
              <li
                key={p.id}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Link
                  href={`/wiki/${p.slug}`}
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {p.title}
                </Link>
                <div className="muted" style={{ fontSize: 12 }}>
                  {new Date(p.updated_at).toLocaleString("ko-KR")}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <h2 style={{ fontSize: 18 }}>🕒 최근 변경</h2>
          {recent.length === 0 ? (
            <p className="muted">아직 변경 내역이 없습니다. 첫 문서를 만들어보세요!</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recent.map((c) => (
                <li
                  key={c.revision_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Avatar
                    id={c.author_avatar ?? "m1"}
                    config={c.author_config}
                    size={30}
                    ownerId={c.author_id}
                    ownerName={c.author_name}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/wiki/${c.slug}`}
                      style={{ fontWeight: 600, textDecoration: "none" }}
                    >
                      {c.page_title}
                    </Link>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {c.author_name ?? "알 수 없음"} ·{" "}
                      {new Date(c.created_at).toLocaleString("ko-KR")}
                      {c.summary ? ` · ${c.summary}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
