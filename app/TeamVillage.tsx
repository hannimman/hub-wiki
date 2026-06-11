"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarFullV2 } from "@/lib/avatar/render";
import { SCENES } from "./wiki/PlazaScenes";
import type { VillageMember } from "@/lib/home";

// 팀 마을 — 루트 페이지의 큰 무대. 위키 광장보다 넓고(2D), 아바타도 크다.
// 모든 멤버가 동일한 규칙으로 자유롭게 돌아다닌다(활동에 따른 차별 연출 없음).
// 상하(깊이) 이동 시 원근 스케일·겹침 순서를 함께 조정한다.

const CHAR_W = 112; // 광장(84)보다 큰 기본 크기
const GREETINGS = [
  "안녕하세요! 👋",
  "오늘도 화이팅! 💪",
  "좋은 하루예요 ☀️",
  "위키 구경 오세요 📚",
  "반가워요~",
  "산책 중이에요 🚶",
  "여기 경치 좋네요",
  "다들 안녕! 🙌",
];

export default function TeamVillage({
  members,
  scene,
}: {
  members: VillageMember[];
  scene: number;
}) {
  const villageRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<Record<number, string>>({});

  useEffect(() => {
    const village = villageRef.current;
    if (!village) return;
    const timers: number[] = [];
    let alive = true;

    const chars = Array.from(
      village.querySelectorAll<HTMLElement>(".village-char")
    );

    // 깊이(bottom px) → 원근 스케일. 아래(가까움)일수록 크게.
    const depthRange = () => Math.max(40, village.clientHeight * 0.3);
    const scaleFor = (bottom: number) =>
      1.12 - (bottom / depthRange()) * 0.3; // 1.12(맨앞) ~ 0.82(맨뒤)

    chars.forEach((el, i) => {
      const apply = (x: number, bottom: number, dur = 0) => {
        el.style.transition = dur
          ? `left ${dur}s linear, bottom ${dur}s linear, transform ${dur}s linear`
          : "none";
        el.style.left = `${x}px`;
        el.style.bottom = `${bottom}px`;
        el.style.transform = `scale(${scaleFor(bottom)})`;
        el.style.zIndex = `${Math.round(200 - bottom)}`;
      };

      const randPos = () => ({
        x: Math.random() * Math.max(1, village.clientWidth - CHAR_W),
        bottom: 6 + Math.random() * depthRange(),
      });

      const p0 = randPos();
      apply(p0.x, p0.bottom);

      const svg = el.querySelector("svg");
      const MOVE = ["av-walk", "av-run"];
      const IDLE = ["av-dance", "av-wave", "av-hop"];
      const clearActions = () => {
        if (!svg) return;
        [...MOVE, ...IDLE].forEach((c) => svg.classList.remove(c));
      };

      const idleThen = (next: () => void) => {
        if (!alive) return;
        const roll = Math.random();
        if (svg && roll < 0.55) {
          const act = IDLE[Math.floor(Math.random() * IDLE.length)];
          svg.classList.add(act);
          const actDur = 1600 + Math.random() * 2400;
          timers.push(
            window.setTimeout(() => {
              svg.classList.remove(act);
              timers.push(window.setTimeout(next, 500 + Math.random() * 1500));
            }, actDur)
          );
        } else {
          timers.push(window.setTimeout(next, 900 + Math.random() * 3000));
        }
      };

      const wander = () => {
        if (!alive) return;
        clearActions();
        const cur = {
          x: parseFloat(el.style.left || "0"),
          bottom: parseFloat(el.style.bottom || "6"),
        };
        const target = randPos();
        const dist = Math.hypot(target.x - cur.x, target.bottom - cur.bottom);
        if (dist < 30) {
          idleThen(wander);
          return;
        }
        // 지면 속도-걸음 주기 동기화 (걷기 ~20px/s, 달리기 ~48px/s — 광장과 동일 원리)
        const running = Math.random() < 0.22;
        const speed = running ? 42 + Math.random() * 12 : 17 + Math.random() * 8;
        const dur = dist / speed;
        apply(target.x, target.bottom, dur);
        if (svg) {
          svg.style.transform = target.x < cur.x ? "scaleX(-1)" : "";
          svg.classList.add(running ? "av-run" : "av-walk");
        }
        timers.push(
          window.setTimeout(() => {
            if (!alive) return;
            clearActions();
            idleThen(wander);
          }, dur * 1000)
        );
      };

      timers.push(
        window.setTimeout(wander, 400 + i * 600 + Math.random() * 1500)
      );
    });

    // 눈 깜빡임 (마을 공용)
    const blink = () => {
      if (!alive) return;
      village.querySelectorAll("svg .eyes").forEach((eyes) => {
        if (Math.random() < 0.6) {
          eyes.classList.add("blink");
          window.setTimeout(() => eyes.classList.remove("blink"), 140);
        }
      });
      timers.push(window.setTimeout(blink, 2200 + Math.random() * 3000));
    };
    timers.push(window.setTimeout(blink, 2000));

    // 인사 말풍선 — 가끔 아무나 한 명이 한마디 (데이터성 정보 없음)
    const chat = () => {
      if (!alive) return;
      if (chars.length > 0) {
        const idx = Math.floor(Math.random() * chars.length);
        const msg = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        setBubbles((prev) => ({ ...prev, [idx]: msg }));
        timers.push(
          window.setTimeout(() => {
            setBubbles((prev) => {
              const n = { ...prev };
              delete n[idx];
              return n;
            });
          }, 2800)
        );
      }
      timers.push(window.setTimeout(chat, 5000 + Math.random() * 6000));
    };
    timers.push(window.setTimeout(chat, 3500));

    return () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  return (
    <div className="village" ref={villageRef}>
      <div className="plaza-scene" aria-hidden>
        {SCENES[((scene % SCENES.length) + SCENES.length) % SCENES.length]}
      </div>
      {members.map((m, i) => (
        <div key={m.id} className="village-char" style={{ width: CHAR_W }}>
          {bubbles[i] && <div className="village-bubble">{bubbles[i]}</div>}
          <AvatarFullV2 data={m.data} width={CHAR_W} uid={`vlg${i}`} noBg />
          <div className="plaza-name">{m.name}</div>
        </div>
      ))}
    </div>
  );
}
