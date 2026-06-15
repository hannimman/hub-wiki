"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarFullV2, AvatarBustV2 } from "@/lib/avatar/render";
import { findItem } from "@/lib/avatar/catalog";
import { RACE_BET, racePayout } from "@/lib/points-shared";
import type { VillageMember } from "@/lib/home";
import {
  buildRunners,
  simulate,
  eventMult,
  hashStr,
  mulberry32,
  DT,
  type Runner,
  type Sim,
} from "@/lib/race-sim";

// 🏁 오늘의 달리기 경주 — 사람마다 "다른" 결과를 본다(시드에 viewer id 를 섞음).
// 시뮬레이션 핵심 로직은 lib/race-sim.ts(서버 정산과 공유). 여기선 UI·연출만 담당.

const CHAR_W = 64;
const GUTTER = 62; // 좌측 이름표 영역 — 선수는 이 오른쪽(출발선)부터 달린다

// 아바타 동작 클래스 (globals.css 정의). 몸풀기 때 선수마다 다른 포즈를 섞는다.
const MOTION = ["av-run", "av-walk", "av-dance", "av-wave", "av-hop"];
const WARMUPS = ["av-hop", "av-dance", "av-wave", "av-walk", "av-hop", "av-dance"];

// ── 선수 소개 (착용 아이템 + 칭찬/야유) ──
const ITEM_SLOTS = [
  "hat", "handR", "handL", "top", "bottom", "faceAcc", "shoes", "hair", "decoL", "decoR",
];
const PRAISE = [
  "오늘 패션 자신감 넘치네요!",
  "멋진 코디입니다!",
  "우승 후보다운 자태!",
  "관중석이 들썩입니다!",
];
const JEER = [
  "그걸로 달릴 수 있겠어요?",
  "과연 통할까요?",
  "용기 하나는 인정합니다",
  "관중석에서 야유가 나오는데요?",
];
function rosterLine(r: Runner): string {
  const eq = (r.member.data?.equipped ?? {}) as Record<string, string | null | undefined>;
  const names: string[] = [];
  for (const slot of ITEM_SLOTS) {
    const id = eq[slot];
    if (!id) continue;
    const it = findItem(slot, id);
    if (it?.name) names.push(it.name);
  }
  const name = r.member.name;
  if (names.length === 0) return `🏃 ${name} 선수, 기본 차림으로 출전!`;
  // 착용 아이템 중 하나만 랜덤으로 언급 (여러 개 나열은 읽기 힘듦)
  const item = names[Math.floor(Math.random() * names.length)];
  return Math.random() < 0.5
    ? `👏 ${name} 선수, '${item}' 착용! ${PRAISE[Math.floor(Math.random() * PRAISE.length)]}`
    : `😏 ${name} 선수, '${item}'… ${JEER[Math.floor(Math.random() * JEER.length)]}`;
}

// ── 경기장 + 날씨 (실행마다 시드로 랜덤) ──
type Horizon = "stadium" | "beach" | "desert" | "snow" | "city" | "forest";
type Scene = {
  name: string;
  surface: string; // 트랙 바닥 (채도 높아 피부색과 대비됨)
  band: string; // 상단 풍경 띠 하늘색
  horizon: Horizon;
  dark?: boolean; // 어두운 무대 (이름표는 흰 배경이라 그대로 가독)
};
type Weather = { name: string; emoji: string; kind: string; tint: string };

const SCENES: Scene[] = [
  { name: "종합운동장", surface: "#c0563d", band: "#bfe3ff", horizon: "stadium" },
  { name: "해변 트랙", surface: "#2f8fb0", band: "#9fe0ef", horizon: "beach" },
  { name: "사막 서킷", surface: "#b5532e", band: "#ffd49a", horizon: "desert" },
  { name: "설원 트랙", surface: "#6f9fc6", band: "#dbeaf6", horizon: "snow" },
  { name: "도심 야경", surface: "#414a63", band: "#1f2a44", horizon: "city", dark: true },
  { name: "숲속 오솔길", surface: "#6b8f4a", band: "#bfe6cf", horizon: "forest" },
];
const WEATHERS: Weather[] = [
  { name: "맑음", emoji: "☀️", kind: "clear", tint: "transparent" },
  { name: "비", emoji: "🌧️", kind: "rain", tint: "rgba(40,60,90,0.18)" },
  { name: "눈", emoji: "🌨️", kind: "snow", tint: "rgba(200,220,255,0.15)" },
  { name: "강풍", emoji: "💨", kind: "wind", tint: "rgba(180,200,210,0.10)" },
  { name: "노을", emoji: "🌇", kind: "dusk", tint: "rgba(255,140,60,0.16)" },
];
function pickVenue(seed: string): { scene: Scene; weather: Weather } {
  const rng = mulberry32(hashStr(`${seed}|venue`));
  return {
    scene: SCENES[Math.floor(rng() * SCENES.length)],
    weather: WEATHERS[Math.floor(rng() * WEATHERS.length)],
  };
}

// ── 트랙 배경 (상단 풍경 띠 + 트랙 바닥 + 출발선/결승 체커 + 날씨) ──
function HorizonArt({ kind, band }: { kind: Horizon; band: string }) {
  const wrap: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 34,
    width: "100%",
    display: "block",
  };
  if (kind === "stadium")
    return (
      <svg style={wrap} viewBox="0 0 200 34" preserveAspectRatio="none">
        <rect width="200" height="34" fill={band} />
        <path d="M0 34 L0 16 L200 9 L200 34 Z" fill="#9aa7bd" />
        <path d="M0 25 L200 18" stroke="#7e8ca0" strokeWidth="1.6" />
        {Array.from({ length: 46 }, (_, i) => (
          <circle
            key={i}
            cx={2 + i * 4.3}
            cy={20 + ((i * 7) % 9)}
            r="1.1"
            fill={i % 4 === 0 ? "#e36b6b" : i % 3 === 0 ? "#69b0e0" : "#f0c659"}
          />
        ))}
      </svg>
    );
  if (kind === "beach")
    return (
      <svg style={wrap} viewBox="0 0 200 34" preserveAspectRatio="none">
        <rect width="200" height="34" fill={band} />
        <rect y="22" width="200" height="12" fill="#2f86b0" />
        <path d="M0 24 Q10 21 20 24 T40 24 T60 24 T80 24 T100 24 T120 24 T140 24 T160 24 T180 24 T200 24 V34 H0 Z" fill="#3f9bc4" />
        {[24, 168].map((x) => (
          <g key={x}>
            <rect x={x} y="10" width="2.4" height="16" fill="#7a4a25" />
            <path d={`M${x + 1} 11 Q${x - 9} 6 ${x - 14} 10 M${x + 1} 11 Q${x + 11} 6 ${x + 16} 10 M${x + 1} 11 Q${x - 6} 3 ${x - 10} 1 M${x + 1} 11 Q${x + 8} 3 ${x + 12} 1`} stroke="#2f9e5a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    );
  if (kind === "desert")
    return (
      <svg style={wrap} viewBox="0 0 200 34" preserveAspectRatio="none">
        <rect width="200" height="34" fill={band} />
        <path d="M0 34 Q50 18 100 26 Q150 33 200 22 V34 Z" fill="#d99a55" />
        <path d="M0 34 Q60 26 120 31 Q170 34 200 30 V34 Z" fill="#c98742" />
        {[40, 150].map((x) => (
          <g key={x} fill="#3f7d3a">
            <rect x={x} y="16" width="3.4" height="14" rx="1.6" />
            <rect x={x - 5} y="20" width="3" height="6" rx="1.5" />
            <rect x={x + 4.6} y="18" width="3" height="8" rx="1.5" />
          </g>
        ))}
      </svg>
    );
  if (kind === "snow")
    return (
      <svg style={wrap} viewBox="0 0 200 34" preserveAspectRatio="none">
        <rect width="200" height="34" fill={band} />
        {[18, 52, 96, 140, 178].map((x, i) => (
          <g key={x}>
            <polygon points={`${x},10 ${x - 9},30 ${x + 9},30`} fill="#3f7a55" />
            <polygon points={`${x},10 ${x - 5},19 ${x + 5},19`} fill="#eaf4ec" opacity={0.85} />
          </g>
        ))}
        <rect y="29" width="200" height="5" fill="#eef6fc" />
      </svg>
    );
  if (kind === "city")
    return (
      <svg style={wrap} viewBox="0 0 200 34" preserveAspectRatio="none">
        <rect width="200" height="34" fill={band} />
        {[
          [6, 14], [26, 8], [40, 20], [60, 11], [78, 24], [100, 9],
          [116, 18], [138, 12], [156, 22], [178, 10],
        ].map(([x, h], i) => (
          <g key={i}>
            <rect x={x} y={34 - h} width="15" height={h} fill="#2b3450" />
            {Array.from({ length: Math.floor(h / 4) }, (_, r) => (
              <rect key={r} x={x + 2} y={34 - h + 2 + r * 4} width="2" height="2" fill="#ffd86b" opacity={(i + r) % 3 ? 0.85 : 0.3} />
            ))}
          </g>
        ))}
      </svg>
    );
  // forest
  return (
    <svg style={wrap} viewBox="0 0 200 34" preserveAspectRatio="none">
      <rect width="200" height="34" fill={band} />
      {[14, 40, 70, 104, 140, 176].map((x, i) => (
        <g key={x}>
          <rect x={x - 1} y="22" width="2.4" height="10" fill="#6b4a2c" />
          <polygon points={`${x},8 ${x - 11},24 ${x + 11},24`} fill="#3f8048" />
          <polygon points={`${x},14 ${x - 8},27 ${x + 8},27`} fill="#4f9456" />
        </g>
      ))}
    </svg>
  );
}

function WeatherFX({ weather }: { weather: Weather }) {
  const snow = weather.kind === "snow";
  if (weather.kind !== "rain" && !snow) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 47) % 100}%`,
            top: -10,
            width: snow ? 5 : 2,
            height: snow ? 5 : 11,
            borderRadius: snow ? "50%" : 1,
            background: snow ? "rgba(255,255,255,0.92)" : "rgba(200,214,240,0.85)",
            animation: `raceFall ${(snow ? 2.2 : 0.7) + (i % 5) * 0.13}s linear ${(i % 7) * 0.22}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function TrackBackdrop({ scene, weather }: { scene: Scene; weather: Weather }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", borderRadius: 11 }}>
      {/* 트랙 바닥 */}
      <div style={{ position: "absolute", inset: 0, background: scene.surface }} />
      {/* 상단 풍경 띠 */}
      <HorizonArt kind={scene.horizon} band={scene.band} />
      {/* 출발선 */}
      <div style={{ position: "absolute", left: GUTTER, top: 34, bottom: 0, width: 3, background: "rgba(255,255,255,0.8)" }} />
      {/* 결승 체커 */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 34,
          bottom: 0,
          width: 14,
          opacity: 0.7,
          backgroundImage: "repeating-linear-gradient(45deg,#fff 0 6px,#222 6px 12px)",
        }}
      />
      {/* 날씨 색조 + 입자 */}
      {weather.tint !== "transparent" && (
        <div style={{ position: "absolute", inset: 0, background: weather.tint }} />
      )}
      <WeatherFX weather={weather} />
    </div>
  );
}

export default function TeamRace({
  members,
  dateSeed,
  viewerId,
}: {
  members: VillageMember[];
  dateSeed: string;
  viewerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [betOpen, setBetOpen] = useState(false);
  const canBet = members.length >= RACE_BET.minRunners;
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        🏁 오늘의 달리기 경주
      </button>
      <button
        className="btn"
        onClick={() => setBetOpen(true)}
        disabled={!canBet}
        title={canBet ? "" : `${RACE_BET.minRunners}명 이상 출전해야 베팅할 수 있어요`}
      >
        💰 베팅 경주
      </button>
      {open && (
        <RaceModal
          members={members}
          seed={`${dateSeed}|${viewerId}`}
          onClose={() => setOpen(false)}
        />
      )}
      {betOpen && (
        <BettingModal members={members} onClose={() => setBetOpen(false)} />
      )}
    </>
  );
}

// 베팅 결과 응답
type BetResult = {
  seed: string;
  memberIds: string[];
  pickId: string;
  place: number;
  payout: number;
  stake: number;
  balance: number;
  won: boolean;
};

function BettingModal({
  members,
  onClose,
}: {
  members: VillageMember[];
  onClose: () => void;
}) {
  const router = useRouter();
  const n = members.length;
  const [pickId, setPickId] = useState<string | null>(null);
  const [stake, setStake] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<"bet" | "racing" | "result">("bet");
  const [result, setResult] = useState<BetResult | null>(null);

  const clampStake = (v: number) =>
    Math.max(10, Math.min(RACE_BET.maxStake, Math.round(v / 10) * 10));

  async function submit() {
    if (!pickId || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/race/bet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pickUserId: pickId, stake }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error ?? "베팅에 실패했어요.");
      } else {
        setResult(d as BetResult);
        setPhase("racing");
      }
    } catch {
      setErr("네트워크 오류가 발생했어요.");
    }
    setBusy(false);
  }

  // 재생 단계 — 서버 시드로 경주를 그대로 보여준다 (내 픽 강조)
  if (phase === "racing" && result) {
    const replayMembers = members.filter((m) => result.memberIds.includes(m.id));
    return (
      <RaceModal
        members={replayMembers}
        seed={result.seed}
        fixedSeed={result.seed}
        pickId={result.pickId}
        title="💰 베팅 경주"
        onEnd={() => setPhase("result")}
        onClose={() => {
          router.refresh();
          onClose();
        }}
      />
    );
  }

  // 결과 단계
  if (phase === "result" && result) {
    const pickName = members.find((m) => m.id === result.pickId)?.name ?? "선수";
    const net = result.payout - result.stake;
    return (
      <div className="modal-backdrop" onClick={() => { router.refresh(); onClose(); }}>
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 360, textAlign: "center" }}
        >
          <div style={{ fontSize: 40 }}>{result.won ? "🎉" : "😢"}</div>
          <h3 style={{ margin: "4px 0" }}>
            {result.won ? "적중!" : "아쉽네요"}
          </h3>
          <p style={{ fontSize: 15, margin: "6px 0" }}>
            <b>{pickName}</b> 선수 <b>{result.place}위</b>
          </p>
          <p style={{ fontSize: 14, margin: "6px 0" }}>
            판돈 {result.stake.toLocaleString()}P →{" "}
            {result.payout > 0 ? (
              <b style={{ color: "#16a34a" }}>배당 +{result.payout.toLocaleString()}P</b>
            ) : (
              <b style={{ color: "#dc2626" }}>전액 잃음</b>
            )}
            {result.payout > 0 && (
              <span className="muted">
                {" "}
                (순{net >= 0 ? "이익" : "손실"} {net >= 0 ? "+" : ""}
                {net.toLocaleString()}P)
              </span>
            )}
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            잔액 🪙 {result.balance.toLocaleString()}P
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setResult(null);
                setPickId(null);
                setPhase("bet");
              }}
            >
              다시 베팅
            </button>
            <button
              className="btn btn-sm"
              onClick={() => { router.refresh(); onClose(); }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 베팅 단계 — 선수 선택 + 판돈
  const p1 = racePayout(1, n, stake);
  const p3 = racePayout(3, n, stake);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460, width: "100%" }}
      >
        <div className="row-between" style={{ marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>💰 베팅 경주</h3>
          <button className="btn btn-sm" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "0 0 6px" }}>
          1등에 걸지만 <b>1·2·3등</b>이면 차등 배당! 하루 {RACE_BET.dailyCount}회 ·
          1회 {RACE_BET.maxStake}P · 합 {RACE_BET.dailyTotal}P
        </p>

        <div style={{ fontSize: 13, fontWeight: 700, margin: "8px 0 4px" }}>
          누가 1등 할까요?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setPickId(m.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "6px 8px",
                borderRadius: 10,
                border:
                  pickId === m.id
                    ? "2px solid #f59e0b"
                    : "1px solid var(--border)",
                background: pickId === m.id ? "#fff7e6" : "#fff",
                cursor: "pointer",
                minWidth: 64,
              }}
            >
              <AvatarBustV2 data={m.data} size={42} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</span>
            </button>
          ))}
        </div>

        <div className="row" style={{ alignItems: "center", gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>판돈</span>
          <button className="btn btn-sm" onClick={() => setStake((s) => clampStake(s - 10))}>
            −10
          </button>
          <b style={{ fontSize: 16, minWidth: 54, textAlign: "center" }}>{stake}P</b>
          <button className="btn btn-sm" onClick={() => setStake((s) => clampStake(s + 10))}>
            +10
          </button>
          <span className="muted" style={{ fontSize: 12 }}>
            (최대 {RACE_BET.maxStake}P)
          </span>
        </div>

        <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>
          예상 배당: 1등 ×{Math.max(1, n - 2)}={p1.toLocaleString()}P · 2등 본전 · 3등{" "}
          {p3.toLocaleString()}P (그 외 잃음)
        </p>

        {err && (
          <p style={{ color: "#dc2626", fontSize: 13, margin: "8px 0 0" }}>{err}</p>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 12 }}
          disabled={!pickId || busy}
          onClick={submit}
        >
          {busy
            ? "베팅 중…"
            : pickId
            ? `${members.find((m) => m.id === pickId)?.name}에 ${stake}P 베팅하고 출발 🏁`
            : "선수를 골라주세요"}
        </button>
      </div>
    </div>
  );
}

function RaceModal({
  members,
  seed,
  onClose,
  fixedSeed,
  pickId,
  onEnd,
  title,
}: {
  members: VillageMember[];
  seed: string;
  onClose: () => void;
  fixedSeed?: string; // 있으면 이 시드로 고정 재생(베팅) — 새 경주 비활성
  pickId?: string; // 내가 베팅한 선수 강조
  onEnd?: () => void; // 재생(총평 포함) 종료 시 호출
  title?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  // 돌릴 때마다 다른 경주 — 매 실행마다 새 nonce 로 시드를 바꾼다.
  // (viewer id 도 섞여 있어 옆 사람과도 다르고, 매번도 달라진다)
  const [nonce, setNonce] = useState(() => Math.floor(Math.random() * 1e9));
  const [caption, setCaption] = useState<string>("🏁 출발!");
  const [phase, setPhase] = useState<"intro" | "countdown" | "racing">("intro");
  const [bigCount, setBigCount] = useState<string | null>(null);

  // 베팅이면 서버 시드로 고정, 아니면 nonce 로 매번 새 경주
  const liveSeed = fixedSeed ?? `${seed}|${nonce}`;
  const venue = useMemo(() => pickVenue(liveSeed), [liveSeed]);
  const runners = useMemo(
    () => buildRunners(members, liveSeed),
    [members, liveSeed]
  );
  const sim = useMemo(
    () => simulate(runners, liveSeed, venue.weather.kind),
    [runners, liveSeed, venue.weather.kind]
  );

  const medalOf = (name: string) => {
    const i = sim.ranking.findIndex(
      (idx) => runners[idx].member.name === name
    );
    return i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || runners.length === 0) return;
    setFinished([]);
    setPhase("intro");
    setBigCount(null);
    setRunning(true);

    const lanes = Array.from(track.querySelectorAll<HTMLElement>(".race-char"));
    const svgs = lanes.map((el) => el.querySelector("svg"));
    const W = track.clientWidth - CHAR_W - GUTTER - 18;
    const steps = sim.pos[0]?.length ?? 0;
    const timers: number[] = [];
    let raf = 0;
    const clearMotion = (s: Element | null) =>
      MOTION.forEach((c) => s?.classList.remove(c));

    // 출발선 정렬 + 몸풀기(선수마다 다른 포즈: 점프·춤·인사·걷기)
    lanes.forEach((el) => (el.style.transform = "translateX(0px)"));
    svgs.forEach((s, i) => s?.classList.add(WARMUPS[i % WARMUPS.length]));

    const sampleAt = (i: number, tSec: number) => {
      const f = tSec / DT;
      const a = Math.floor(f);
      if (a >= steps - 1) return sim.pos[i][steps - 1] ?? 1;
      const frac = f - a;
      return sim.pos[i][a] * (1 - frac) + sim.pos[i][a + 1] * frac;
    };

    const startRace = () => {
      setPhase("racing");
      setBigCount(null);
      const doneSet = new Set<number>();
      const fxEls = lanes.map((el) => el.querySelector<HTMLElement>(".race-fx"));
      const curFx = new Array(runners.length).fill("");
      const FX = ["race-trip", "race-slip", "race-dash"];
      let lastCapIdx = -1;
      let simT = 0;
      let last = performance.now();
      const tick = (now: number) => {
        const real = (now - last) / 1000;
        last = now;
        // 포토피니시면 1등 결승 직전 1초를 슬로모
        const slowmo =
          sim.photoFinish &&
          simT > sim.winnerFinish - 1.0 &&
          simT < sim.winnerFinish + 0.2;
        simT += real * (slowmo ? 0.35 : 1);

        runners.forEach((r, i) => {
          const el = lanes[i];
          if (!el) return;
          const p = sampleAt(i, simT);
          el.style.transform = `translateX(${p * W}px)`;
          const svg = svgs[i];
          const fxEl = fxEls[i];
          if (svg) {
            if (p >= 1) {
              if (!doneSet.has(i)) {
                doneSet.add(i);
                svg.classList.remove("av-run");
                svg.classList.add(doneSet.size <= 3 ? "av-dance" : "av-wave");
                setFinished((prev) =>
                  prev.includes(r.member.name) ? prev : [...prev, r.member.name]
                );
              }
              if (curFx[i]) {
                curFx[i] = "";
                FX.forEach((c) => svg.classList.remove(c));
                if (fxEl) fxEl.style.opacity = "0";
              }
            } else {
              if (!svg.classList.contains("av-run")) svg.classList.add("av-run");
              // 이벤트 구간이면 선수에게 효과(휘청/미끄러짐/대시 + 이모지)
              const ev = eventMult(r, simT);
              const key = ev ? `${ev.emoji}-${ev.at}` : "";
              if (key !== curFx[i]) {
                curFx[i] = key;
                FX.forEach((c) => svg.classList.remove(c));
                if (ev) {
                  const cls =
                    ev.mult < 0.3 ? "race-trip" : ev.mult < 1 ? "race-slip" : "race-dash";
                  svg.classList.add(cls);
                  if (fxEl) {
                    fxEl.textContent = ev.emoji;
                    fxEl.style.opacity = "1";
                    fxEl.style.animation = "none";
                    void fxEl.offsetWidth;
                    fxEl.style.animation = "fxPop 0.35s ease";
                  }
                } else if (fxEl) {
                  fxEl.style.opacity = "0";
                }
              }
            }
          }
        });

        // 중계 자막 — simT 이하의 가장 최근 자막
        let capIdx = lastCapIdx;
        for (let k = sim.captions.length - 1; k >= 0; k--) {
          if (sim.captions[k].t <= simT) {
            capIdx = k;
            break;
          }
        }
        if (capIdx !== lastCapIdx && capIdx >= 0) {
          lastCapIdx = capIdx;
          setCaption(sim.captions[capIdx].text);
        }

        if (simT < sim.playEndT) {
          raf = requestAnimationFrame(tick);
        } else {
          setRunning(false);
          onEnd?.();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    // ── 인트로: 무대·날씨 소개 → 선수 소개 → 카운트다운 → 출발 ──
    setCaption(
      `🏟️ 오늘의 무대: ${venue.scene.name}! 날씨는 ${venue.weather.name} ${venue.weather.emoji}`
    );
    let at = 1700;
    runners.forEach((r) => {
      const line = rosterLine(r);
      timers.push(window.setTimeout(() => setCaption(line), at));
      at += 1300;
    });
    timers.push(
      window.setTimeout(() => {
        setPhase("countdown");
        setCaption("🚦 선수들 출발선에 섭니다!");
        svgs.forEach(clearMotion); // 몸풀기 멈추고 준비 자세
      }, at)
    );
    at += 900;
    ["3", "2", "1"].forEach((c) => {
      timers.push(window.setTimeout(() => setBigCount(c), at));
      at += 800;
    });
    timers.push(window.setTimeout(() => setBigCount("출발!"), at));
    at += 600;
    timers.push(
      window.setTimeout(() => {
        setBigCount(null);
        startRace();
      }, at)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal race-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, width: "100%" }}
      >
        <div className="row-between" style={{ marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>{title ?? "🏁 오늘의 달리기 경주"}</h3>
          <button className="btn btn-sm" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "2px 0 6px" }}>
          {fixedSeed
            ? "내가 베팅한 경주! 🎯 표시된 선수를 응원하세요"
            : "돌릴 때마다 새로운 경주! 누가 1등 할지 아무도 몰라요 🎲"}
        </p>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          🏟️ {venue.scene.name} · {venue.weather.emoji} {venue.weather.name}
        </div>

        {/* 실황 중계 자막 */}
        <div
          key={caption}
          style={{
            background: "#101727",
            color: "#ffe9a8",
            fontSize: 14,
            fontWeight: 700,
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 10,
            textAlign: "center",
            animation: "captionFade 0.3s ease",
          }}
        >
          📣 {caption}
        </div>

        <div
          className="race-track"
          ref={trackRef}
          key={nonce}
          style={{ position: "relative", overflow: "hidden" }}
        >
          {/* 경기장 + 날씨 배경 (실행마다 랜덤) */}
          <TrackBackdrop scene={venue.scene} weather={venue.weather} />

          {runners.map((r) => (
            <div
              key={r.member.id}
              className="race-lane"
              style={{
                position: "relative",
                zIndex: 1,
                ...(r.member.id === pickId
                  ? { boxShadow: "inset 0 0 0 2px #ffcf33", borderRadius: 6 }
                  : null),
              }}
            >
              <span className="race-name">
                {r.member.id === pickId ? "🎯 " : ""}
                {r.member.name}
              </span>
              <div className="race-char" style={{ width: CHAR_W, left: GUTTER }}>
                <span className="race-fx" aria-hidden />
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
              {finished.includes(r.member.name) && medalOf(r.member.name) && (
                <span className="race-medal" aria-hidden>
                  {medalOf(r.member.name)}
                </span>
              )}
            </div>
          ))}

          {/* 카운트다운 오버레이 */}
          {bigCount && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <span
                key={bigCount}
                style={{
                  fontSize: 76,
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 3px 14px rgba(0,0,0,0.55)",
                  animation: "captionFade 0.25s ease",
                }}
              >
                {bigCount}
              </span>
            </div>
          )}
        </div>

        <div className="row-between" style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13 }}>
            {finished.slice(0, 3).map((n, i) => (
              <span key={n} style={{ marginRight: 10, fontWeight: 700 }}>
                {["🥇", "🥈", "🥉"][i]} {n}
              </span>
            ))}
          </div>
          {!fixedSeed && (
            <button
              className="btn btn-sm"
              disabled={running}
              onClick={() => setNonce(Math.floor(Math.random() * 1e9))}
            >
              {running ? "달리는 중…" : "🔄 새 경주"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
