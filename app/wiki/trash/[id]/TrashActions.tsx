"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ParentOption = { id: string; label: string };

// 삭제글 상세의 액션 바 — 복원(상위 폴더 선택, 기본 최상위) + 영구 삭제(관리자).
export default function TrashActions({
  pageId,
  slug,
  parentOptions,
  isAdmin,
}: {
  pageId: string;
  slug: string;
  parentOptions: ParentOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [parentId, setParentId] = useState(""); // "" = 최상위
  const [busy, setBusy] = useState(false);

  async function restore() {
    setBusy(true);
    const res = await fetch(`/api/pages/${pageId}/untrash`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parentId: parentId || null }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(`/wiki/${slug}`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "복원에 실패했습니다.");
    }
  }

  async function purge() {
    if (
      !confirm(
        "이 문서를 영구 삭제할까요?\n리비전·평가 기록까지 삭제되며 복구할 수 없습니다."
      )
    )
      return;
    if (!confirm("정말 영구 삭제하시겠어요? 되돌릴 수 없습니다.")) return;
    setBusy(true);
    const res = await fetch(`/api/pages/${pageId}/purge`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/wiki/trash");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "영구 삭제에 실패했습니다.");
    }
  }

  return (
    <div
      className="row"
      style={{ gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}
    >
      <span className="muted" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
        복원 위치
      </span>
      <select
        value={parentId}
        onChange={(e) => setParentId(e.target.value)}
        style={{
          padding: "7px 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          fontSize: 13,
          maxWidth: 280,
        }}
      >
        <option value="">(최상위)</option>
        {parentOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        className="btn btn-primary btn-sm"
        onClick={restore}
        disabled={busy}
      >
        ♻ 복원
      </button>
      {isAdmin && (
        <button
          className="btn btn-sm"
          style={{ color: "#c62828", borderColor: "#e9b8b4" }}
          onClick={purge}
          disabled={busy}
        >
          💥 영구 삭제
        </button>
      )}
    </div>
  );
}
