"use client";

import { useEffect, useRef } from "react";
import { AvatarFullV2, type AvatarV2Data } from "@/lib/avatar/render";
import { SCENES } from "./PlazaScenes";

export type PlazaMember = { id: string; name: string; data: AvatarV2Data };

// 팀 광장 — 멤버들의 전신 아바타가 빈 공간을 천천히 돌아다닌다.
// 각 캐릭터: 랜덤 목적지로 걷기(left CSS transition + .av-walk 관절 스윙 + 방향 flip) → 잠깐 쉬고 반복.
// className 으로 배경 변형(.plaza--doc 등), uidPrefix 로 페이지 내 SVG id 충돌 방지.
export default function WikiPlaza({
  members,
  className = "",
  uidPrefix = "plz",
  title,
  scene,
}: {
  members: PlazaMember[];
  className?: string;
  uidPrefix?: string;
  title?: string; // 미지정 시 툴팁 없음 (팀 광장은 툴팁 없이)
  scene?: number; // PlazaScenes 풍경 인덱스 — 지정 시 SVG 풍경을 배경으로 깐다
}) {
  const plazaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const plaza = plazaRef.current;
    if (!plaza) return;
    const timers: number[] = [];
    let alive = true;

    const chars = Array.from(
      plaza.querySelectorAll<HTMLElement>(".plaza-char")
    );

    chars.forEach((el, i) => {
      const svg = el.querySelector("svg");
      const charW = 84;

      const place = () => {
        const w = plaza.clientWidth - charW;
        el.style.left = `${Math.random() * Math.max(1, w)}px`;
      };
      place();

      const MOVE_CLASSES = ["av-walk", "av-run"];
      const IDLE_CLASSES = ["av-dance", "av-wave", "av-hop"];
      const clearActions = () => {
        if (!svg) return;
        [...MOVE_CLASSES, ...IDLE_CLASSES].forEach((c) =>
          svg.classList.remove(c)
        );
      };

      // 도착 후: 가끔 춤/인사/점프, 아니면 가만히 쉬었다가 다음 이동
      const idleThen = (next: () => void) => {
        if (!alive) return;
        const roll = Math.random();
        if (svg && roll < 0.55) {
          const act =
            IDLE_CLASSES[Math.floor(Math.random() * IDLE_CLASSES.length)];
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
        const w = plaza.clientWidth - charW;
        const cur = parseFloat(el.style.left || "0");
        const target = Math.random() * Math.max(1, w);
        const dist = Math.abs(target - cur);
        if (dist < 24) {
          idleThen(wander);
          return;
        }
        // 발걸음과 지면 속도 동기화 (빠르면 미끄러지는 문워크처럼 보임):
        // 걷기 0.76s 주기 → ~20px/s, 달리기 0.38s 주기 → ~48px/s
        const running = Math.random() < 0.22;
        const speed = running ? 42 + Math.random() * 12 : 17 + Math.random() * 8;
        const dur = dist / speed;
        el.style.transition = `left ${dur}s linear`;
        el.style.left = `${target}px`;
        if (svg) {
          svg.style.transform = target < cur ? "scaleX(-1)" : "";
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

      // 시작 시점을 흩뿌려 동시에 출발하지 않게
      timers.push(window.setTimeout(wander, 400 + i * 700 + Math.random() * 1500));
    });

    // 눈 깜빡임 (광장 전체 공용)
    const blink = () => {
      if (!alive) return;
      plaza.querySelectorAll("svg .eyes").forEach((eyes) => {
        if (Math.random() < 0.6) {
          eyes.classList.add("blink");
          window.setTimeout(() => eyes.classList.remove("blink"), 140);
        }
      });
      timers.push(window.setTimeout(blink, 2200 + Math.random() * 3000));
    };
    timers.push(window.setTimeout(blink, 2000));

    return () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [members.length]);

  if (members.length === 0) return null;

  return (
    <div
      className={`plaza${className ? ` ${className}` : ""}`}
      ref={plazaRef}
      title={title}
    >
      {scene != null && (
        <div className="plaza-scene" aria-hidden>
          {SCENES[((scene % SCENES.length) + SCENES.length) % SCENES.length]}
        </div>
      )}
      {members.map((m, i) => (
        <div key={m.id} className="plaza-char">
          <AvatarFullV2 data={m.data} width={84} uid={`${uidPrefix}${i}`} noBg />
          <div className="plaza-name">{m.name}</div>
        </div>
      ))}
    </div>
  );
}
