"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarFullV2 } from "@/lib/avatar/render";
import { SCENES } from "./wiki/PlazaScenes";
import type { VillageMember } from "@/lib/home";

// 팀 마을 — 루트 페이지의 큰 무대. 위키 광장보다 넓고(2D), 아바타도 크다.
// 모든 멤버가 동일한 규칙으로 자유롭게 돌아다닌다(활동에 따른 차별 연출 없음).
// 인터랙션:
//  * 바닥 클릭 → 내 아바타가 그 지점으로 걸어감(멀면 달림, 이동 중 재클릭 가능)
//  * 아바타 클릭 → 폴짝 + 하트
//  * 💬 오늘의 한마디 → 저장하면 모두의 마을에서 내 아바타가 말함
//  * ◀▶ 풍경 넘기기 (기본은 시간대·계절 자동)

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
  meId = null,
  myMessage = null,
}: {
  members: VillageMember[];
  scene: number;
  meId?: string | null;
  myMessage?: string | null;
}) {
  const villageRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<Record<number, string>>({});
  const [hearts, setHearts] = useState<Record<number, number>>({});
  const [sceneIdx, setSceneIdx] = useState(scene);
  const [sayOpen, setSayOpen] = useState(false);
  const [myMsg, setMyMsg] = useState(myMessage ?? "");
  const [saving, setSaving] = useState(false);

  const myIdx = meId ? members.findIndex((m) => m.id === meId) : -1;
  const moveMeRef = useRef<((x: number, bottom: number) => void) | null>(null);
  const myMsgRef = useRef(myMsg);
  myMsgRef.current = myMsg;

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

    const setupChar = (el: HTMLElement, i: number) => {
      const svg = el.querySelector("svg");
      const MOVE = ["av-walk", "av-run"];
      const IDLE = ["av-dance", "av-wave", "av-hop"];
      const clearActions = () => {
        if (!svg) return;
        [...MOVE, ...IDLE].forEach((c) => svg.classList.remove(c));
      };

      const apply = (x: number, bottom: number, dur = 0) => {
        el.style.transition = dur
          ? `left ${dur}s linear, bottom ${dur}s linear, transform ${dur}s linear`
          : "none";
        el.style.left = `${x}px`;
        el.style.bottom = `${bottom}px`;
        el.style.transform = `scale(${scaleFor(bottom)})`;
      };

      const randPos = () => ({
        x: Math.random() * Math.max(1, village.clientWidth - CHAR_W),
        bottom: 6 + Math.random() * depthRange(),
      });

      const p0 = randPos();
      apply(p0.x, p0.bottom);

      // 현재 "보이는" 위치 (이동 중 재타겟용 — style.left 는 목표값이라 computed 로 읽는다)
      const currentPos = () => {
        const cs = window.getComputedStyle(el);
        return {
          x: parseFloat(cs.left) || 0,
          bottom: parseFloat(cs.bottom) || 6,
        };
      };

      const walkTo = (
        target: { x: number; bottom: number },
        onArrive: () => void,
        myTimerBox?: { id: number | null }
      ) => {
        const cur = currentPos();
        // 이동 중이었다면 현재 위치에서 동결 후 새 이동 시작
        apply(cur.x, cur.bottom, 0);
        void el.offsetWidth; // reflow — 동결을 확정
        clearActions();
        const dist = Math.hypot(target.x - cur.x, target.bottom - cur.bottom);
        if (dist < 12) {
          onArrive();
          return;
        }
        // 지면 속도-걸음 주기 동기화 (걷기 ~20px/s, 달리기 ~48px/s)
        const running = dist > 240 || Math.random() < 0.22;
        const speed = running ? 42 + Math.random() * 12 : 17 + Math.random() * 8;
        const dur = dist / speed;
        apply(target.x, target.bottom, dur);
        if (svg) {
          svg.style.transform = target.x < cur.x ? "scaleX(-1)" : "";
          svg.classList.add(running ? "av-run" : "av-walk");
        }
        const tid = window.setTimeout(() => {
          if (!alive) return;
          clearActions();
          onArrive();
        }, dur * 1000);
        timers.push(tid);
        if (myTimerBox) myTimerBox.id = tid;
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

      if (i === myIdx) {
        // 내 아바타: 자율 배회 없음 — 클릭한 곳으로만 이동(이동 중 재클릭 가능)
        const myTimer: { id: number | null } = { id: null };
        moveMeRef.current = (x: number, bottom: number) => {
          if (!alive) return;
          if (myTimer.id != null) window.clearTimeout(myTimer.id);
          walkTo(
            { x, bottom },
            () => {
              // 도착 후 가벼운 제스처 한 번
              if (svg && Math.random() < 0.5) {
                const act = IDLE[Math.floor(Math.random() * IDLE.length)];
                svg.classList.add(act);
                timers.push(
                  window.setTimeout(() => svg.classList.remove(act), 1800)
                );
              }
            },
            myTimer
          );
        };
      } else {
        // 다른 멤버: 자유 배회
        const wander = () => {
          if (!alive) return;
          walkTo(randPos(), () => idleThen(wander));
        };
        timers.push(
          window.setTimeout(wander, 400 + i * 600 + Math.random() * 1500)
        );
      }
    };

    chars.forEach(setupChar);

    // 겹침 순서 — 실제 발 위치 기준 매 프레임 갱신
    let rafId = 0;
    const syncZ = () => {
      if (!alive) return;
      const top = village.getBoundingClientRect().top;
      chars.forEach((el) => {
        el.style.zIndex = `${Math.round(
          el.getBoundingClientRect().bottom - top
        )}`;
      });
      rafId = window.requestAnimationFrame(syncZ);
    };
    rafId = window.requestAnimationFrame(syncZ);

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

    // 말풍선 — 한마디가 있으면 그 말을, 없으면 기본 인사말
    const chat = () => {
      if (!alive) return;
      if (chars.length > 0) {
        const idx = Math.floor(Math.random() * chars.length);
        const saved =
          idx === myIdx ? myMsgRef.current.trim() : members[idx]?.message ?? "";
        const msg =
          saved || GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        setBubbles((prev) => ({ ...prev, [idx]: msg }));
        timers.push(
          window.setTimeout(() => {
            setBubbles((prev) => {
              const n = { ...prev };
              delete n[idx];
              return n;
            });
          }, 3000)
        );
      }
      timers.push(window.setTimeout(chat, 5000 + Math.random() * 6000));
    };
    timers.push(window.setTimeout(chat, 3500));

    return () => {
      alive = false;
      window.cancelAnimationFrame(rafId);
      timers.forEach((t) => window.clearTimeout(t));
      moveMeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length, myIdx]);

  // 바닥 클릭 → 내 아바타 이동
  function onGroundClick(e: React.MouseEvent) {
    const village = villageRef.current;
    if (!village || myIdx < 0 || !moveMeRef.current) return;
    const rect = village.getBoundingClientRect();
    const depth = Math.max(40, rect.height * 0.3);
    const x = Math.min(
      Math.max(0, e.clientX - rect.left - CHAR_W / 2),
      Math.max(0, rect.width - CHAR_W)
    );
    const bottom = Math.min(Math.max(6, rect.bottom - e.clientY - 24), depth);
    moveMeRef.current(x, bottom);
  }

  // 아바타 클릭 → 폴짝 + 하트
  function react(i: number, el: HTMLElement) {
    setHearts((prev) => ({ ...prev, [i]: Date.now() }));
    window.setTimeout(() => {
      setHearts((prev) => {
        const n = { ...prev };
        delete n[i];
        return n;
      });
    }, 1200);
    const svg = el.querySelector("svg");
    if (svg && !svg.classList.contains("av-walk") && !svg.classList.contains("av-run")) {
      svg.classList.add("av-hop");
      window.setTimeout(() => svg.classList.remove("av-hop"), 1000);
    }
  }

  async function saveMyMessage() {
    setSaving(true);
    const res = await fetch("/api/me/status", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: myMsg }),
    });
    setSaving(false);
    if (res.ok) setSayOpen(false);
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "저장에 실패했습니다.");
    }
  }

  const sceneCount = SCENES.length;
  const safeScene = ((sceneIdx % sceneCount) + sceneCount) % sceneCount;

  return (
    <div
      className={`village${myIdx >= 0 ? " village--mine" : ""}`}
      ref={villageRef}
      onClick={onGroundClick}
      title={myIdx >= 0 ? "바닥을 클릭하면 내 아바타가 걸어가요" : undefined}
    >
      <div className="plaza-scene" aria-hidden>
        {SCENES[safeScene]}
      </div>

      {/* 풍경 넘기기 (기본은 시간대 자동) */}
      <div className="village-ctrl" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setSceneIdx((v) => v - 1)} aria-label="이전 풍경">
          ◀
        </button>
        <button onClick={() => setSceneIdx((v) => v + 1)} aria-label="다음 풍경">
          ▶
        </button>
      </div>

      {/* 오늘의 한마디 (로그인 + 마을에 내 아바타가 있을 때만) */}
      {myIdx >= 0 && (
        <div className="village-say" onClick={(e) => e.stopPropagation()}>
          {sayOpen ? (
            <span className="village-sayform">
              <input
                autoFocus
                value={myMsg}
                maxLength={50}
                placeholder="오늘의 한마디 (모두에게 보여요)"
                onChange={(e) => setMyMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveMyMessage();
                  if (e.key === "Escape") setSayOpen(false);
                }}
              />
              <button onClick={saveMyMessage} disabled={saving}>
                {saving ? "…" : "저장"}
              </button>
            </span>
          ) : (
            <button onClick={() => setSayOpen(true)}>💬 한마디</button>
          )}
        </div>
      )}

      {members.map((m, i) => (
        <div
          key={m.id}
          className="village-char"
          style={{ width: CHAR_W, cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            react(i, e.currentTarget);
          }}
        >
          {bubbles[i] && <div className="village-bubble">{bubbles[i]}</div>}
          {hearts[i] && (
            <span className="village-hearts" key={hearts[i]} aria-hidden>
              <i>❤️</i>
              <i>💖</i>
              <i>❤️</i>
            </span>
          )}
          <AvatarFullV2 data={m.data} width={CHAR_W} uid={`vlg${i}`} noBg />
          <div className="plaza-name">
            {m.name}
            {i === myIdx ? " (나)" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
