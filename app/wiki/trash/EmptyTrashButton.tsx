"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 휴지통 비우기 (관리자 전용) — 복구 불가라 2단계 확인.
export default function EmptyTrashButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function emptyTrash() {
    if (
      !confirm(
        `휴지통의 ${count}개 항목을 전부 영구 삭제할까요?\n리비전·평가 기록까지 삭제되며 복구할 수 없습니다.`
      )
    )
      return;
    if (!confirm("정말 비우시겠어요? 이 작업은 되돌릴 수 없습니다.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/trash", { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "휴지통 비우기에 실패했습니다.");
    }
  }

  return (
    <button className="btn btn-sm" onClick={emptyTrash} disabled={busy}>
      {busy ? "비우는 중…" : "🧹 휴지통 비우기"}
    </button>
  );
}
