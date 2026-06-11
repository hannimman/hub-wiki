"use client";

import { useRef, useState } from "react";

// 흉상 아이콘 + 호버 풀착장 팝업 + (owner 정보가 있으면) 클릭 시 아바타 카드 모달.
// 카드 모달: 전신 아바타 + 이름 + 본인이 아니면 🎁 포인트 선물 폼.
// 팝업은 position:fixed 로 띄워서 표/사이드바 등 overflow 컨테이너 안에서도
// 잘리지 않는다(뷰포트 기준 배치 + 가장자리 클램프).
// SVG 문자열은 서버(AvatarBustV2)에서 합성해 prop 으로 받는다.

const POP_SVG_W = 150;
const POP_SVG_H = 188;
const POP_PAD = 7; // padding 6 + border 1
const POP_W = POP_SVG_W + POP_PAD * 2;
const POP_H = POP_SVG_H + POP_PAD * 2;
const GAP = 8;
const SHOW_DELAY_MS = 250; // 스쳐 지나갈 땐 안 뜨게

export default function BustHover({
  bustSvg,
  fullSvg,
  bustViewBox,
  fullViewBox,
  size,
  ownerId = null,
  ownerName = null,
}: {
  bustSvg: string;
  fullSvg: string;
  bustViewBox: string;
  fullViewBox: string;
  size: number;
  ownerId?: string | null; // 이 아바타의 주인 — 있으면 클릭 시 카드 모달
  ownerName?: string | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // ── 아바타 카드 모달 (클릭) ──
  const [cardOpen, setCardOpen] = useState(false);
  const [me, setMe] = useState<{ id: string | null; points: number } | null>(
    null
  );
  const [amount, setAmount] = useState("100");
  const [memo, setMemo] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function openCard() {
    if (!ownerId) return;
    hide();
    setCardOpen(true);
    setDone(false);
    try {
      const res = await fetch("/api/me/summary");
      setMe(await res.json());
    } catch {
      setMe({ id: null, points: 0 });
    }
  }

  async function sendGift() {
    if (!ownerId) return;
    const n = Math.trunc(Number(amount));
    if (!Number.isFinite(n) || n <= 0) {
      alert("선물할 포인트를 입력하세요.");
      return;
    }
    if (!confirm(`${ownerName ?? "이 멤버"}님에게 ${n.toLocaleString()}P를 선물할까요?`))
      return;
    setSending(true);
    const res = await fetch(`/api/users/${ownerId}/gift`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: n, memo }),
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setMe((m) => (m ? { ...m, points: m.points - n } : m));
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "선물에 실패했습니다.");
    }
  }

  function show() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let left = r.left + r.width / 2 - POP_W / 2;
      left = Math.max(GAP, Math.min(left, window.innerWidth - POP_W - GAP));
      let top = r.bottom + GAP;
      if (top + POP_H > window.innerHeight - GAP) top = r.top - POP_H - GAP;
      top = Math.max(GAP, top);
      setPos({ left, top });
    }, SHOW_DELAY_MS);
  }
  function hide() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setPos(null);
  }

  const isMine = !!(me?.id && ownerId && me.id === ownerId);
  const canGift = !!(me?.id && ownerId && me.id !== ownerId);

  return (
    <span
      ref={ref}
      className="av-hover"
      style={{
        width: size,
        height: size,
        cursor: ownerId ? "pointer" : undefined,
      }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={(e) => {
        if (!ownerId) return;
        e.stopPropagation();
        openCard();
      }}
    >
      <svg
        viewBox={bustViewBox}
        width={size}
        height={size}
        role="img"
        aria-label="아바타"
        style={{ borderRadius: "50%", background: "#eef4fb", flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: bustSvg }}
      />
      {pos && (
        <span
          className="av-pop-fixed"
          style={{ left: pos.left, top: pos.top }}
          aria-hidden
        >
          <svg
            viewBox={fullViewBox}
            width={POP_SVG_W}
            height={POP_SVG_H}
            dangerouslySetInnerHTML={{ __html: fullSvg }}
          />
        </span>
      )}

      {/* 아바타 카드 모달 — 전신 + 이름 + (타인) 선물 폼 */}
      {cardOpen && (
        <span
          className="modal-backdrop"
          style={{ cursor: "default" }}
          onClick={(e) => {
            e.stopPropagation();
            setCardOpen(false);
          }}
        >
          <span
            className="modal"
            style={{ maxWidth: 320, display: "block", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              viewBox={fullViewBox}
              width={180}
              height={225}
              style={{ display: "block", margin: "0 auto", borderRadius: 10 }}
              dangerouslySetInnerHTML={{ __html: fullSvg }}
            />
            <span
              style={{
                display: "block",
                fontWeight: 800,
                fontSize: 17,
                marginTop: 6,
              }}
            >
              {ownerName ?? "멤버"}
              {isMine ? " (나)" : ""}
            </span>

            {canGift && !done && (
              <span style={{ display: "block", marginTop: 12, textAlign: "left" }}>
                <span
                  className="muted"
                  style={{ display: "block", fontSize: 12, marginBottom: 6 }}
                >
                  🎁 포인트 선물 — 내 잔액 {me!.points.toLocaleString()}P
                </span>
                <span style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) setAmount(e.target.value);
                    }}
                    style={{
                      width: 90,
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      textAlign: "right",
                    }}
                  />
                  <input
                    placeholder="메모 (선택)"
                    value={memo}
                    maxLength={50}
                    onChange={(e) => setMemo(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                    }}
                  />
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                  onClick={sendGift}
                  disabled={sending}
                >
                  {sending ? "보내는 중…" : "🎁 선물 보내기"}
                </button>
              </span>
            )}
            {canGift && done && (
              <span
                style={{
                  display: "block",
                  marginTop: 12,
                  color: "#2e7d32",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                ✅ 선물을 보냈어요!
              </span>
            )}

            <button
              className="btn btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setCardOpen(false)}
            >
              닫기
            </button>
          </span>
        </span>
      )}
    </span>
  );
}
