"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RestoreButton({
  pageId,
  revisionId,
}: {
  pageId: string;
  revisionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function restore() {
    if (!confirm("이 버전으로 복원할까요?")) return;
    setLoading(true);
    const res = await fetch(`/api/pages/${pageId}/restore`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ revisionId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/wiki/${data.slug}`);
      router.refresh();
    } else {
      alert(data.error ?? "복원에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={restore}
      disabled={loading}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: "1px solid #3b82f6",
        background: "#fff",
        color: "#3b82f6",
        cursor: "pointer",
        fontSize: 13,
        whiteSpace: "nowrap",
      }}
    >
      {loading ? "…" : "이 버전으로 복원"}
    </button>
  );
}
