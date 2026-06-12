"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// 미확인 알림 모달.
// 헤더(루트 레이아웃)는 소프트 내비게이션에서 다시 렌더되지 않으므로,
// 초기값은 서버에서 받고 이후엔 "경로 변경 + 45초 폴링"으로 직접 조회한다.
type Item = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const POLL_MS = 45_000;

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

export default function GiftAlert({
  initialItems = [],
}: {
  initialItems?: Item[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [busy, setBusy] = useState(false);
  // 시간 표기는 서버/브라우저 로케일·시간대가 달라 hydration 불일치를 일으키므로
  // 마운트 후(클라이언트에서만) 채운다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const firstPath = useRef(true);
  async function checkUnread() {
    try {
      const res = await fetch("/api/me/notifications");
      const d = await res.json();
      if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items);
    } catch {
      /* 네트워크 오류는 무시 — 다음 기회에 */
    }
  }

  // 페이지 이동 시 조회 (첫 렌더는 서버 초기값이 있으므로 건너뜀)
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    checkUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 주기 폴링 — 같은 화면에 머물러도 도착을 감지
  useEffect(() => {
    const id = window.setInterval(checkUnread, POLL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmRead() {
    setBusy(true);
    await fetch("/api/me/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: items.map((i) => i.id) }),
    }).catch(() => {});
    setBusy(false);
    setItems([]);
    router.refresh(); // 헤더 잔액 갱신
  }

  if (items.length === 0) return null;

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
                  {mounted ? new Date(n.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false }) : " "}
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
