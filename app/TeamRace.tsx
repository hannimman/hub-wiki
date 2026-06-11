"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarFullV2 } from "@/lib/avatar/render";
import type { VillageMember } from "@/lib/home";

// 🏁 오늘의 달리기 경주 — 전 멤버가 함께 달린다.
// 날짜(KST)를 시드로 한 결정론 시뮬레이션이라 누가 언제 봐도 "같은 경주, 같은 순위".
// (실시간 서버 없이 "모두 다같이"를 구현하는 방법)

const CHAR_W = 64;
const RACE_MIN_S = 7;
const RACE_VAR_S = 5;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Runner = {
  member: VillageMember;
  finishS: number; // 완주 시간(초) — 작을수록 1등
  phase: number; // 흔들림 위상 (역전 연출)
  wobble: number;
};

export default function TeamRace({
  members,
  dateSeed,
}: {
  members: VillageMember[];
  dateSeed: string; // KST YYYY-MM-DD (서버에서 내려줌 — 모두 동일)
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        🏁 오늘의 달리기 경주
      </button>
      {open && (
        <RaceModal
          members={members}
          dateSeed={dateSeed}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function RaceModal({
  members,
  dateSeed,
  onClose,
}: {
  members: VillageMember[];
  dateSeed: string;
  onClose: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState<string[]>([]); // 들어온 순서(이름)
  const [running, setRunning] = useState(false);
  const [runKey, setRunKey] = useState(0); // 다시 보기

  // 시드 기반 러너 프로필 (멤버 순서는 id 정렬로 고정 — 모두 같은 결과)
  const sorted = [...members].sort((a, b) => (a.id < b.id ? -1 : 1));
  const rng = mulberry32(hashStr(`${dateSeed}|race`));
  const runners: Runner[] = sorted.map((m) => ({
    member: m,
    finishS: RACE_MIN_S + rng() * RACE_VAR_S,
    phase: rng() * Math.PI * 2,
    wobble: 0.05 + rng() * 0.08,
  }));
  const ranking = [...runners]
    .sort((a, b) => a.finishS - b.finishS)
    .map((r) => r.member.name);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    setFinished([]);
    setRunning(true);

    const lanes = Array.from(
      track.querySelectorAll<HTMLElement>(".race-char")
    );
    const W = track.clientWidth - CHAR_W - 24;
    const start = performance.now();
    const doneSet = new Set<number>();
    let raf = 0;

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      let allDone = true;
      runners.forEach((r, i) => {
        const el = lanes[i];
        if (!el) return;
        const base = Math.min(1, t / r.finishS);
        // 진행률에 흔들림을 더해 역전 연출 (완주 시점은 finishS 로 고정)
        const noise =
          r.wobble * Math.sin(t * 1.7 + r.phase) * base * (1 - base) * 4;
        const p = Math.max(0, Math.min(1, base + noise));
        el.style.transform = `translateX(${p * W}px)`;
        const svg = el.querySelector("svg");
        if (svg) {
          if (base >= 1) {
            if (!doneSet.has(i)) {
              doneSet.add(i);
              svg.classList.remove("av-run");
              svg.classList.add(doneSet.size <= 3 ? "av-dance" : "av-wave");
              setFinished((prev) =>
                prev.includes(r.member.name) ? prev : [...prev, r.member.name]
              );
            }
          } else {
            allDone = false;
            if (!svg.classList.contains("av-run")) svg.classList.add("av-run");
          }
        }
      });
      if (!allDone) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  const medalOf = (name: string) => {
    const i = ranking.indexOf(name);
    return i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal race-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, width: "100%" }}
      >
        <div className="row-between" style={{ marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>🏁 오늘의 달리기 경주</h3>
          <button className="btn btn-sm" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "2px 0 10px" }}>
          {dateSeed} — 매일 자동 개최! 누가 언제 봐도 같은 경주, 같은 순위예요.
        </p>

        <div className="race-track" ref={trackRef} key={runKey}>
          {runners.map((r) => (
            <div key={r.member.id} className="race-lane">
              <span className="race-name">
                {finished.includes(r.member.name) ? medalOf(r.member.name) : ""}
                {r.member.name}
              </span>
              <div className="race-char" style={{ width: CHAR_W }}>
                <AvatarFullV2
                  data={r.member.data}
                  width={CHAR_W}
                  uid={`race${r.member.id.slice(0, 4)}`}
                  noBg
                />
              </div>
              <span className="race-finish" aria-hidden>
                🏁
              </span>
            </div>
          ))}
        </div>

        <div className="row-between" style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13 }}>
            {finished.slice(0, 3).map((n, i) => (
              <span key={n} style={{ marginRight: 10, fontWeight: 700 }}>
                {["🥇", "🥈", "🥉"][i]} {n}
              </span>
            ))}
          </div>
          <button
            className="btn btn-sm"
            disabled={running}
            onClick={() => setRunKey((k) => k + 1)}
          >
            {running ? "달리는 중…" : "▶ 다시 보기"}
          </button>
        </div>
      </div>
    </div>
  );
}
