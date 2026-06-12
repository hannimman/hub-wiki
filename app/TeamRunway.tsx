"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarFullV2 } from "@/lib/avatar/render";
import type { VillageMember } from "@/lib/home";

// 패션쇼 런웨이 — 멤버가 한 명씩 무대 안쪽에서 등장해 세로 런웨이를 걸어
// 앞(카메라)으로 다가오고(원근 확대), 포즈를 잡은 뒤 돌아 들어간다.
// 양옆엔 관객 실루엣, 곳곳에서 카메라 플래시가 터진다.

const CHAR_W = 120;
const POSES = ["av-wave", "av-dance", "av-hop"];
const GREETINGS = [
  "안녕하세요! 👋",
  "오늘 패션 어때요?",
  "찍어주세요! 📸",
  "다들 멋지죠? ✨",
  "런웨이 데뷔예요!",
  "후후, 긴장되네요",
];

// 관객 실루엣 좌표 (좌/우 객석, viewBox 800x420) — 결정적 배치
const AUDIENCE: { x: number; y: number; r: number }[] = [];
for (let row = 0; row < 4; row++) {
  for (let i = 0; i < 6; i++) {
    const y = 235 + row * 48;
    const rOff = row * 26;
    AUDIENCE.push({ x: 58 + i * 32 + rOff * 0.4, y, r: 13 + row * 1.5 });
    AUDIENCE.push({ x: 742 - i * 32 - rOff * 0.4, y, r: 13 + row * 1.5 });
  }
}

function RunwayScene() {
  return (
    <svg
      viewBox="0 0 800 420"
      preserveAspectRatio="xMidYMax slice"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    >
      {/* 어두운 쇼장 */}
      <rect width="800" height="420" fill="#17171f" />
      <rect width="800" height="180" fill="#1d1d28" />
      {/* 스포트라이트 */}
      <polygon points="400,0 250,420 550,420" fill="#fff7e0" opacity="0.07" />
      <polygon points="400,0 330,420 470,420" fill="#fff7e0" opacity="0.09" />
      {/* 런웨이 (세로, 원근) */}
      <polygon points="356,180 444,180 565,420 235,420" fill="#efe9f4" />
      <polygon points="368,180 432,180 530,420 270,420" fill="#f9f6fb" />
      {/* 런웨이 가장자리 조명 */}
      {Array.from({ length: 7 }, (_, i) => {
        const t = i / 6;
        const y = 192 + t * 215;
        const lx = 362 - t * 118;
        const rx = 438 + t * 118;
        return (
          <g key={i}>
            <circle cx={lx} cy={y} r={3 + t * 2} fill="#ffd34d" opacity="0.9" />
            <circle cx={rx} cy={y} r={3 + t * 2} fill="#ffd34d" opacity="0.9" />
          </g>
        );
      })}
      {/* 관객 실루엣 (머리 + 어깨) */}
      {AUDIENCE.map((a, i) => (
        <g key={i} fill={i % 5 === 0 ? "#34344a" : "#2a2a3a"}>
          <circle cx={a.x} cy={a.y} r={a.r} />
          <ellipse cx={a.x} cy={a.y + a.r + 9} rx={a.r * 1.5} ry={a.r * 0.85} />
        </g>
      ))}
      {/* 몇몇 관객의 응원봉 */}
      {[2, 9, 17, 26, 33, 41].map((idx) => {
        const a = AUDIENCE[idx % AUDIENCE.length];
        return (
          <g key={idx}>
            <line
              x1={a.x + a.r}
              y1={a.y - 2}
              x2={a.x + a.r + 9}
              y2={a.y - 16}
              stroke="#5ad1e6"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={a.x + a.r + 10} cy={a.y - 18} r="3.5" fill="#8ee8f7" />
          </g>
        );
      })}
    </svg>
  );
}

export default function TeamRunway({ members }: { members: VillageMember[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [walker, setWalker] = useState(0);
  const [posing, setPosing] = useState(false);
  const [line, setLine] = useState<string | null>(null); // 포즈 때 한마디 말풍선

  // 등장 순서 랜덤 — SSR 불일치를 피하려고 초기엔 등록순, 마운트 후 셔플
  const [order, setOrder] = useState<number[]>(() =>
    members.map((_, i) => i)
  );
  useEffect(() => {
    setOrder((prev) => {
      const n = [...prev];
      for (let i = n.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [n[i], n[j]] = [n[j], n[i]];
      }
      return n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || members.length === 0) return;
    const timers: number[] = [];
    let alive = true;

    const el = stage.querySelector<HTMLElement>(".runway-char");
    const svg = el?.querySelector("svg");
    if (!el || !svg) return;

    const H = stage.clientHeight;
    const far = { bottom: H * 0.5, scale: 0.42 };
    const near = { bottom: 12, scale: 1.18 };

    // 무대 안쪽에서 시작
    el.style.transition = "none";
    el.style.bottom = `${far.bottom}px`;
    el.style.transform = `translateX(-50%) scale(${far.scale})`;
    el.style.opacity = "0";
    void el.offsetWidth;

    // 눈 깜빡임
    const blink = () => {
      if (!alive) return;
      svg.querySelectorAll(".eyes").forEach((eyes) => {
        eyes.classList.add("blink");
        window.setTimeout(() => eyes.classList.remove("blink"), 140);
      });
      timers.push(window.setTimeout(blink, 2400 + Math.random() * 2600));
    };
    timers.push(window.setTimeout(blink, 1500));

    const DOWN_S = 5;
    const UP_S = 4;

    const walkDown = () => {
      if (!alive) return;
      el.style.opacity = "1";
      el.style.transition = `bottom ${DOWN_S}s linear, transform ${DOWN_S}s linear, opacity 0.5s`;
      el.style.bottom = `${near.bottom}px`;
      el.style.transform = `translateX(-50%) scale(${near.scale})`;
      svg.classList.add("av-walk");
      timers.push(window.setTimeout(pose, DOWN_S * 1000));
    };

    const pose = () => {
      if (!alive) return;
      svg.classList.remove("av-walk");
      setPosing(true);
      // 포즈 때 한마디 — 등록한 "오늘의 한마디"가 있으면 그 말, 없으면 랜덤
      const m = members[order[walker % order.length] ?? 0];
      setLine(
        m?.message?.trim() ||
          GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
      );
      const act = POSES[Math.floor(Math.random() * POSES.length)];
      svg.classList.add(act);
      timers.push(
        window.setTimeout(() => {
          svg.classList.remove(act);
          setPosing(false);
          setLine(null);
          walkUp();
        }, 2600)
      );
    };

    const walkUp = () => {
      if (!alive) return;
      el.style.transition = `bottom ${UP_S}s linear, transform ${UP_S}s linear, opacity 0.6s ${UP_S - 0.6}s`;
      el.style.bottom = `${far.bottom}px`;
      el.style.transform = `translateX(-50%) scale(${far.scale})`;
      el.style.opacity = "0";
      svg.classList.add("av-walk");
      timers.push(
        window.setTimeout(() => {
          if (alive) setWalker((i) => (i + 1) % members.length);
        }, UP_S * 1000 + 400)
      );
    };

    timers.push(window.setTimeout(walkDown, 700));

    return () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walker, members.length, order]);

  if (members.length === 0) return null;
  const m = members[order[walker % order.length] ?? 0] ?? members[0];

  return (
    <div className="village runway" ref={stageRef}>
      <div className="plaza-scene" aria-hidden>
        <RunwayScene />
      </div>

      {/* 카메라 플래시 — 관객석 곳곳에서 무작위로 번쩍 */}
      <div className="runway-flashes" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${i % 2 === 0 ? 4 + ((i * 3.5) % 26) : 70 + ((i * 4.1) % 26)}%`,
              top: `${52 + ((i * 17) % 38)}%`,
              animationDelay: `${(i * 0.7) % 3.4}s`,
              animationDuration: `${2.6 + (i % 4) * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* 워커 — walker 가 바뀌면 key 로 재마운트 */}
      <div className="runway-char" key={walker} style={{ width: CHAR_W }}>
        {line && <div className="village-bubble">{line}</div>}
        <AvatarFullV2 data={m.data} width={CHAR_W} uid="rwy" noBg />
        <div className="plaza-name">{m.name}</div>
      </div>

      <div className="runway-caption">
        ✨ 지금 런웨이: <b>{m.name}</b>
        {posing ? " — 포즈! 📸" : ""}
      </div>
    </div>
  );
}
