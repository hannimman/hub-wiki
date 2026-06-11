"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 고아 이미지 일괄/개별 삭제 버튼.
export function PurgeAllButton({ paths }: { paths: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function purge() {
    if (
      !confirm(
        `미사용 이미지 ${paths.length}개를 삭제할까요?\n어떤 문서에서도 참조하지 않는 파일만 삭제됩니다.`
      )
    )
      return;
    setBusy(true);
    const res = await fetch("/api/admin/files/purge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paths }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(`${d.removed ?? 0}개를 삭제했습니다.`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "삭제에 실패했습니다.");
    }
  }

  return (
    <button className="btn btn-sm" onClick={purge} disabled={busy}>
      {busy ? "삭제 중…" : `🧹 ${paths.length}개 모두 삭제`}
    </button>
  );
}

export function PurgeOneButton({ path }: { path: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function purge() {
    setBusy(true);
    const res = await fetch("/api/admin/files/purge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paths: [path] }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "삭제에 실패했습니다.");
    }
  }

  return (
    <button className="tw-act" style={{ opacity: 1 }} onClick={purge} disabled={busy}>
      {busy ? "…" : "삭제"}
    </button>
  );
}
