"use client";

import { useState } from "react";
import { ITEM_INDEX } from "@/lib/avatar/catalog";
import { REASON_LABEL, type PointTx } from "@/lib/points";

// 이력 한 줄 설명: 상점 구매는 아이템 코드 대신 한글명으로
function describe(t: PointTx): string {
  const label = REASON_LABEL[t.reason] ?? t.reason;
  if (t.reason === "buy" && t.ref) {
    const item = ITEM_INDEX[t.ref]?.item;
    return `${label} · ${item ? item.name : t.ref}`;
  }
  if ((t.reason === "grant" || t.reason === "event") && t.ref) {
    return `${label} · ${t.ref}`;
  }
  return label;
}

export default function PointHistoryButton({ txs }: { txs: PointTx[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-sm" onClick={() => setOpen(true)}>
        📜 포인트 내역
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 10 }}>
              <b style={{ fontSize: 15 }}>📜 포인트 내역</b>
              <button className="btn btn-sm" onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
            {txs.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                아직 이력이 없어요. 출석하고 문서를 작성해 보세요!
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {txs.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>{describe(t)}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: t.amount >= 0 ? "#16a34a" : "#dc2626",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.amount >= 0 ? "+" : ""}
                      {t.amount.toLocaleString()}P
                    </span>
                    <span
                      className="muted"
                      style={{ fontSize: 11.5, whiteSpace: "nowrap" }}
                    >
                      {new Date(t.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
