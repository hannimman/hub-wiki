import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listPages } from "@/lib/pages";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 820,
  margin: "32px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default async function WikiListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;
  const pages = await listPages(q);

  return (
    <main style={wrap}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>📚 위키 문서</h1>
        <Link
          href="/wiki/new"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "#3b82f6",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          + 새 문서
        </Link>
      </div>

      <form action="/wiki" method="get" style={{ margin: "16px 0" }}>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="제목 검색…"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 15,
            boxSizing: "border-box",
          }}
        />
      </form>

      {pages.length === 0 ? (
        <p style={{ color: "#888" }}>
          {q
            ? "검색 결과가 없습니다."
            : "아직 문서가 없습니다. 첫 문서를 만들어보세요!"}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pages.map((p) => (
            <li
              key={p.id}
              style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}
            >
              <Link
                href={`/wiki/${p.slug}`}
                style={{ fontSize: 17, fontWeight: 600, textDecoration: "none" }}
              >
                {p.title}
              </Link>
              <div style={{ color: "#999", fontSize: 12 }}>
                {new Date(p.updated_at).toLocaleString("ko-KR")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
