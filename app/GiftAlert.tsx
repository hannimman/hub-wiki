"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 미확인 알림 모달 — 공용 헤더가 매 페이지 렌더마다 미읽음을 내려주므로
// "새로고침/페이지 이동 시 감지"가 자연히 충족된다. 확인하면 읽음 처리.
type Item = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

function describe(n: Item): string {
  if (n.type === "gift") {
    const p = (n.payload ?? {}) as {
      from_name?: string;
      amount?: number;
      memo?: string | null;
    };
    const who = p.from_name ?? "누군가";
    const amt = (p.amount ?? 0).toLocaleString();
    return `${who}님이 ${amt}P를 선물했어요!`;
  }
  return "새 알림이 있어요.";
}

export default function GiftAlert({ items }: { items: Item[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(items.length > 0);
  const [busy, setBusy] = useState(false);
  if (!open || items.length === 0) return null;

  async function confirmRead() {
    setBusy(true);
    await fetch("/api/me/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: items.map((i) => i.id) }),
    }).catch(() => {});
    setBusy(false);
    setOpen(false);
    router.refresh(); // 헤더 잔액 갱신
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🎁</div>
        <h3 style={{ margin: "10px 0 4px" }}>선물이 도착했어요!</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>
          {items.map((n) => {
            const memo = (n.payload as { memo?: string | null } | null)?.memo;
            return (
              <li
                key={n.id}
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 14,
                }}
              >
                <b>{describe(n)}</b>
                {memo && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    💬 {memo}
                  </div>
                )}
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                  {new Date(n.created_at).toLocaleString("ko-KR")}
                </div>
              </li>
            );
          })}
        </ul>
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={confirmRead}
          disabled={busy}
        >
          {busy ? "확인 중…" : "확인"}
        </button>
      </div>
    </div>
  );
}
