// 달리기 경주 시뮬레이션 — 서버(베팅 정산)와 클라이언트(애니메이션 재생)가
// 같은 코드로 같은 결과를 내도록 분리한 순수 모듈. (DOM/React 의존 없음)
//  같은 (멤버 집합, 시드) → 항상 같은 등수. 서버가 1등/등수를 정산하고,
//  클라는 같은 시드로 재생만 하므로 결과가 어긋나지 않는다.

import type { VillageMember } from "./home";

export const TRACK_LEN = 1000; // 가상 트랙 길이
export const DT = 0.05; // 시뮬레이션 시간 간격(초)
export const MAX_T = 45; // 안전 상한(초)

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Archetype = "sprinter" | "closer" | "steady" | "erratic";
const ARCHES: Archetype[] = ["sprinter", "closer", "steady", "erratic"];

// 진행률 u(0~1)에 따른 속도 배율 — 성향마다 가속/감속 곡선이 다르다.
function archFactor(a: Archetype, u: number): number {
  switch (a) {
    case "sprinter": // 초반 폭발 → 후반 까임
      return 1.38 - 0.62 * u;
    case "closer": // 막판 추격형
      return 0.68 + 0.66 * u;
    case "erratic": // 들쭉날쭉
      return 1 + 0.26 * Math.sin(u * 9.3 + 1.1);
    default: // steady
      return 0.99;
  }
}

export type RaceEvent = {
  at: number;
  dur: number;
  mult: number;
  emoji: string;
  label: string;
};
export type Runner = {
  member: VillageMember;
  arch: Archetype;
  s0: number; // 기본 속도
  phase: number;
  wobble: number;
  freq: number;
  events: RaceEvent[];
};

export type Caption = { t: number; text: string };
export type Sim = {
  pos: number[][]; // pos[i] = 스텝별 정규화 위치(0~1)
  finishT: number[]; // 러너별 완주 시각(초)
  ranking: number[]; // 등수 → 러너 index
  captions: Caption[];
  endT: number; // 마지막 완주 시각
  playEndT: number; // 총평까지 끝나는 재생 종료 시각
  winnerFinish: number; // 1등 완주 시각
  photoFinish: boolean; // 1·2등 접전?
};

const EV_KINDS: Omit<RaceEvent, "at">[] = [
  { dur: 0.8, mult: 1.75, emoji: "⚡", label: "스피드 부스트!" },
  { dur: 0.6, mult: 0.22, emoji: "😵", label: "넘어졌다!" },
  { dur: 0.5, mult: 0.4, emoji: "🍌", label: "미끄러집니다!" },
  { dur: 0.7, mult: 1.5, emoji: "🚀", label: "갑자기 속도를 올립니다!" },
];

// ── 중계 멘트 풀 (시드로 골라 쓰니 결정론 유지, 매번 다른 문장) ──
const STARTS = [
  "🏁 출발 신호와 함께 일제히 튀어나갑니다!",
  "🏁 자, 오늘의 레이스가 시작됩니다!",
  "🏁 스타트! 과연 누가 먼저 치고 나갈까요?",
  "🏁 선수들 힘차게 출발합니다!",
];
const LEADS: ((a: string, b: string) => string)[] = [
  (a, b) => `🔥 ${a}, ${b}를 제치고 선두로!`,
  (a) => `💨 ${a} 무섭게 앞서 나갑니다!`,
  (a) => `🔥 ${a} 선두 탈환!`,
  (a, b) => `😮 ${a}, ${b}를 추월합니다!`,
  (a) => `🔥 ${a}, 기어이 1위로 올라섭니다!`,
];
const COMEBACKS: ((a: string) => string)[] = [
  (a) => `🚀 ${a}, 후미에서 대역전 드라마!`,
  (a) => `😲 ${a}, 꼴찌권에서 단숨에 선두로!`,
  (a) => `🔥 ${a}, 폭발적인 추격으로 1위 등극!`,
];
const FILLERS: ((s: string) => string)[] = [
  (s) => `👀 ${s}, 바깥쪽에서 기회를 노립니다`,
  (s) => `💪 ${s} 페이스를 끌어올려요!`,
  (s) => `🏃 ${s}, 추격의 고삐를 당깁니다`,
  () => `🔥 선두권 다툼이 치열합니다!`,
  () => `👏 관중들의 환호가 쏟아집니다!`,
  () => `😮 손에 땀을 쥐게 하는 접전!`,
];
const STRUGGLES: ((s: string) => string)[] = [
  (s) => `😅 ${s}, 오늘은 영 페이스가 안 오릅니다`,
  (s) => `🐌 ${s}, 점점 뒤로 처지고 있어요`,
  (s) => `💦 ${s}, 후미에서 고전하고 있습니다`,
];
const FINALS = [
  "🏁 결승선이 보이기 시작합니다!",
  "🏁 이제 마지막 직선 주로!",
  "🏁 막판 승부처에 들어섭니다!",
];
const WEATHER_LINES: Record<string, string[]> = {
  clear: ["☀️ 더없이 좋은 날씨!", "🌤️ 쾌청한 트랙 컨디션입니다!"],
  rain: ["🌧️ 빗속을 뚫고 달립니다!", "💧 트랙이 미끄러워 보이는데요!"],
  snow: ["🌨️ 눈발 속의 질주!", "❄️ 발이 푹푹 빠지는 설원입니다!"],
  wind: ["💨 강한 맞바람을 뚫고!", "🍃 바람이 선수들을 흔듭니다!"],
  dusk: ["🌇 노을을 등지고 달립니다!", "✨ 석양이 트랙을 물들입니다!"],
};
const WIN_LINES: ((a: string) => string)[] = [
  (a) => `🏆 영광의 우승은 ${a}! 압도적인 레이스였습니다`,
  (a) => `🏆 ${a}, 오늘의 챔피언에 등극합니다!`,
  (a) => `🏆 우승 ${a}! 끝까지 페이스를 잃지 않았어요`,
];
const LAST_LINES: ((a: string) => string)[] = [
  (a) => `😂 ${a} 선수는 아쉽게 꼴찌… 다음 기회를 노립니다`,
  (a) => `🐢 ${a}, 완주에 의의를 둡니다!`,
];
const OUTROS = [
  "👏 모든 선수들 수고하셨습니다!",
  "🎉 오늘 경기는 여기까지! 다음 경주도 기대해 주세요",
  "📣 명승부였습니다. 다들 박수 부탁드립니다!",
];

// 시드로 러너 프로필 생성 (실행마다 다른 시드)
export function buildRunners(members: VillageMember[], seed: string): Runner[] {
  // id 정렬로 안정 기준을 잡은 뒤 시드로 레인 순서를 섞는다 (매 실행 레인 배정 변경)
  const ordered = [...members].sort((a, b) => (a.id < b.id ? -1 : 1));
  const lane = mulberry32(hashStr(`${seed}|lane`));
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(lane() * (i + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  const rng = mulberry32(hashStr(`${seed}|race`));
  return ordered.map((m) => {
    const arch = ARCHES[Math.floor(rng() * ARCHES.length)];
    const target = 16 + rng() * 5; // 목표 완주 ~16~21초
    const evCount = rng() < 0.55 ? (rng() < 0.4 ? 2 : 1) : 0;
    const events: RaceEvent[] = [];
    for (let k = 0; k < evCount; k++) {
      const kind = EV_KINDS[Math.floor(rng() * EV_KINDS.length)];
      events.push({ ...kind, at: 2.5 + rng() * (target - 4) });
    }
    return {
      member: m,
      arch,
      s0: TRACK_LEN / target,
      phase: rng() * Math.PI * 2,
      wobble: 0.06 + rng() * 0.06,
      freq: 1.3 + rng() * 1.2,
      events,
    };
  });
}

export function eventMult(r: Runner, t: number): RaceEvent | null {
  for (const e of r.events) {
    if (t >= e.at && t < e.at + e.dur) return e;
  }
  return null;
}

// 시뮬레이션: 모든 러너를 함께 고정 스텝으로 굴려 위치 타임라인과 결과를 만든다.
export function simulate(runners: Runner[], seed: string, weatherKind: string): Sim {
  const n = runners.length;
  const cast = mulberry32(hashStr(`${seed}|cast`));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(cast() * arr.length)];

  const dist = new Array(n).fill(0);
  const finishT = new Array(n).fill(-1);
  const pos: number[][] = Array.from({ length: n }, () => []);
  const captions: Caption[] = [];
  const firedEvents = new Set<string>();

  let leaderAnnounced = -1;
  let prevRank: number[] = new Array(n).fill(0);
  let lastCaptionT = -2;
  let finalCalled = false;
  let finishCalls = 0;
  const say = (t: number, text: string) => {
    captions.push({ t, text });
    lastCaptionT = t;
  };

  say(0, pick(STARTS));

  let t = 0;
  let doneCount = 0;
  for (; t < MAX_T && doneCount < n; t += DT) {
    const leaderDist = Math.max(...dist);
    for (let i = 0; i < n; i++) {
      if (finishT[i] >= 0) {
        pos[i].push(1);
        continue;
      }
      const r = runners[i];
      const u = dist[i] / TRACK_LEN;
      const f = archFactor(r.arch, u);
      const ev = eventMult(r, t);
      const evf = ev ? ev.mult : 1;
      // 고무줄(약): 많이 뒤처진 선수만 살짝 추격 가속. 선두 드래그는 없앰
      const gap = (leaderDist - dist[i]) / TRACK_LEN;
      const rubber = gap > 0.06 ? 1 + Math.min(gap - 0.06, 0.4) * 0.5 : 1;
      const noise = 1 + r.wobble * Math.sin(t * r.freq + r.phase);
      const speed = r.s0 * f * evf * rubber * noise;
      dist[i] += speed * DT;

      // 이벤트 자막 (시작 순간 1회). 긍정 이벤트는 앞쪽 선수일 때만.
      if (ev) {
        const key = `${i}:${ev.at}`;
        if (!firedEvents.has(key)) {
          firedEvents.add(key);
          const positive = ev.mult > 1;
          const aheadCount = dist.filter((d) => d > dist[i]).length;
          if (!positive || aheadCount < Math.ceil(n / 2)) {
            say(t, `${ev.emoji} ${r.member.name} ${ev.label}`);
          }
        }
      }

      if (dist[i] >= TRACK_LEN) {
        dist[i] = TRACK_LEN;
        finishT[i] = t;
        doneCount++;
        finishCalls++;
        if (finishCalls === 1) say(t, `🥇 ${r.member.name} 결승선 통과!`);
        else if (finishCalls === 2) say(t, `🥈 뒤이어 ${r.member.name} 골인!`);
        else if (finishCalls === 3) say(t, `🥉 ${r.member.name} 3위로 들어옵니다!`);
      }
      pos[i].push(Math.min(1, dist[i] / TRACK_LEN));
    }

    // 현재 순위(거리 내림차순)
    const order = runners.map((_, i) => i).sort((a, b) => dist[b] - dist[a]);
    const rankOf = new Array(n).fill(0);
    order.forEach((idx, pos2) => (rankOf[idx] = pos2));
    const leaderIdx = order[0];
    const leadGap = n > 1 ? (dist[order[0]] - dist[order[1]]) / TRACK_LEN : 1;

    if (!finalCalled && doneCount === 0 && dist[leaderIdx] / TRACK_LEN > 0.82) {
      finalCalled = true;
      say(t, pick(FINALS));
    } else if (
      doneCount === 0 &&
      leaderIdx !== leaderAnnounced &&
      leadGap > 0.02 &&
      t > 0.6 &&
      t - lastCaptionT > 1.8
    ) {
      const a = runners[leaderIdx].member.name;
      if (leaderAnnounced < 0) {
        say(t, `🔥 ${a} 선두로 나섭니다!`);
      } else if (prevRank[leaderIdx] >= Math.ceil(n / 2)) {
        say(t, pick(COMEBACKS)(a));
      } else {
        const b = runners[leaderAnnounced].member.name;
        say(t, pick(LEADS)(a, b));
      }
      leaderAnnounced = leaderIdx;
    } else if (doneCount === 0 && t > 2 && t - lastCaptionT > 3.4) {
      const roll = cast();
      if (roll < 0.25) {
        say(t, pick(WEATHER_LINES[weatherKind] ?? WEATHER_LINES.clear));
      } else if (n > 2 && roll < 0.55) {
        say(t, pick(STRUGGLES)(runners[order[n - 1]].member.name));
      } else {
        const front = order[Math.floor(cast() * Math.max(1, n - 1))];
        say(t, pick(FILLERS)(runners[front].member.name));
      }
    }
    prevRank = rankOf;
  }

  for (let i = 0; i < n; i++) if (finishT[i] < 0) finishT[i] = t;

  const ranking = runners.map((_, i) => i).sort((a, b) => finishT[a] - finishT[b]);
  const sortedFin = [...finishT].sort((a, b) => a - b);
  const winnerFinish = sortedFin[0];
  const photoFinish = sortedFin.length > 1 && sortedFin[1] - sortedFin[0] < 0.55;
  if (photoFinish)
    captions.push({ t: Math.max(0, winnerFinish - 0.6), text: "📸 포토피니시!! 초접전!" });

  const endT = Math.max(...finishT);
  const winN = runners[ranking[0]].member.name;
  const lastN = runners[ranking[n - 1]].member.name;
  captions.push({ t: endT + 0.5, text: pick(WIN_LINES)(winN) });
  if (photoFinish)
    captions.push({ t: endT + 2.1, text: "📸 끝까지 손에 땀을 쥐게 한 명승부였습니다!" });
  else if (n > 2) captions.push({ t: endT + 2.1, text: pick(LAST_LINES)(lastN) });
  captions.push({ t: endT + 3.7, text: pick(OUTROS) });
  const playEndT = endT + 5;

  return {
    pos,
    finishT,
    ranking,
    captions: captions.sort((a, b) => a.t - b.t),
    endT,
    playEndT,
    winnerFinish,
    photoFinish,
  };
}

// 서버 정산용 — (멤버, 시드)로 완주 순서(멤버 id 배열)를 계산한다.
// weatherKind 는 멘트에만 영향을 주고 등수에는 영향이 없으므로 "clear" 고정.
export function rankMemberIds(members: VillageMember[], seed: string): string[] {
  const runners = buildRunners(members, seed);
  const sim = simulate(runners, seed, "clear");
  return sim.ranking.map((idx) => runners[idx].member.id);
}
