"use client";

import { useRef, useState } from "react";

// 흉상 아이콘 + 호버 풀착장 팝업.
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
}: {
  bustSvg: string;
  fullSvg: string;
  bustViewBox: string;
  fullViewBox: string;
  size: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

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

  return (
    <span
      ref={ref}
      className="av-hover"
      style={{ width: size, height: size }}
      onMouseEnter={show}
      onMouseLeave={hide}
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
    </span>
  );
}
