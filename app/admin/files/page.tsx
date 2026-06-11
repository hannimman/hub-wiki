import { listOrphanImages } from "@/lib/files";
import { PurgeAllButton, PurgeOneButton } from "./OrphanCleanup";

export const dynamic = "force-dynamic";

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

// 고아 이미지 정리 — 어떤 문서(모든 리비전)에서도 참조하지 않는 업로드 파일.
// 글을 저장하지 않고 떠나면 이런 파일이 남는다. 24시간 유예 후 표시.
export default async function AdminFilesPage() {
  let orphans: Awaited<ReturnType<typeof listOrphanImages>> = [];
  let error: string | null = null;
  try {
    orphans = await listOrphanImages();
  } catch (e) {
    error = e instanceof Error ? e.message : "스토리지 조회에 실패했습니다.";
  }
  const totalSize = orphans.reduce((s, f) => s + f.size, 0);

  return (
    <section>
      <div className="row-between">
        <h2 style={{ fontSize: 18, margin: 0 }}>🧹 고아 이미지 정리</h2>
        {orphans.length > 0 && (
          <PurgeAllButton paths={orphans.map((f) => f.path)} />
        )}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>
        업로드됐지만 어떤 문서에서도 쓰이지 않는 이미지입니다(글을 저장하지 않고
        떠난 경우 등). 문서 히스토리에서 참조하는 파일은 표시되지 않습니다.
        업로드 후 24시간이 지난 파일만 보입니다.
      </p>

      {error ? (
        <p style={{ color: "#c62828", fontSize: 14 }}>
          {error} — 마이그레이션 0011(wiki-images 버킷)이 실행됐는지 확인하세요.
        </p>
      ) : orphans.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>
          미사용 이미지가 없습니다. ✨
        </p>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 13 }}>
            총 {orphans.length}개 · {fmtSize(totalSize)}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {orphans.map((f) => (
              <li
                key={f.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${f.path}`}
                  alt=""
                  width={52}
                  height={52}
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "#f6f8fa",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontFamily: "monospace" }}>
                    {f.path}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {fmtSize(f.size)}
                    {f.created_at
                      ? ` · ${new Date(f.created_at).toLocaleString("ko-KR")}`
                      : ""}
                  </div>
                </div>
                <PurgeOneButton path={f.path} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
