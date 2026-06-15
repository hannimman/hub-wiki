// 포인트 시스템 — 서버/클라이언트 공용 상수·타입 (DB 접근 없음)
// 서버 로직은 lib/points.ts (여기 것들을 re-export 한다).

// 적립 기본값 — 실제 지급액은 슈퍼가 app_settings('point_config')로 조정 가능
export const POINTS = {
  signup: 1000, // 가입 환영 보너스
  attendance: 10,
  newDoc: 30,
  edit: 5,
  ratingReceived: 2,
  ratingGiven: 3,
  deleteDoc: 0, // 문서 삭제 — 음수로 설정하면 차감(기본 0 = 차감 없음)
  gachaCost: 300, // 가챠 1회 비용
  dropRate: 5, // 글 작성 시 아이템 드롭 확률(%)
} as const;

export type PointConfig = {
  signup: number;
  attendance: number;
  newDoc: number;
  edit: number;
  ratingReceived: number;
  ratingGiven: number;
  deleteDoc: number;
  gachaCost: number;
  dropRate: number;
};

// 음수 허용 항목 (차감용)
export const NEGATIVE_ALLOWED: ReadonlySet<keyof PointConfig> = new Set([
  "deleteDoc",
] as (keyof PointConfig)[]);

export const POINT_CONFIG_LABEL: Record<keyof PointConfig, string> = {
  signup: "가입 보너스",
  attendance: "출석 (1일 1회)",
  newDoc: "문서 작성 (하루 3회까지)",
  edit: "문서 수정 (문서당 하루 1회, 총 5회까지)",
  ratingReceived: "평가 받음 (건당)",
  ratingGiven: "평가 참여 (건당, 하루 10회까지)",
  deleteDoc: "문서 삭제 (음수 입력 = 차감)",
  gachaCost: "가챠 1회 비용",
  dropRate: "글 작성 아이템 드롭 확률 (%)",
};

// 하루 캡(남용 방지)
export const DAILY_CAP = {
  new_doc: 3, // 새 문서 적립 하루 최대 3건
  edit: 5, // 수정 적립 하루 최대 5건
  rating_given: 10, // 평가 참여 하루 최대 10건
} as const;

// 적립 사유 → 사용자 표시 라벨 (이력 화면용). 새 출처 추가 시 라벨만 더하면 된다.
export const REASON_LABEL: Record<string, string> = {
  signup: "가입 보너스",
  attendance: "출석",
  new_doc: "문서 작성",
  edit: "문서 수정",
  rating_received: "평가 받음",
  rating_given: "평가 참여",
  delete_doc: "문서 삭제",
  buy: "상점 구매",
  grant: "슈퍼 지급",
  event: "이벤트 지급",
  gift_sent: "선물 보냄",
  gift_received: "선물 받음",
  gacha: "가챠",
  item_drop: "새 글 복권 당첨 🎉",
  race_bet: "달리기 베팅",
  race_win: "달리기 배당",
};

// ── 달리기 경주 베팅 ──
// 1등에 걸지만 내 선수가 1·2·3등이면 차등 배당. 4등 이하면 판돈 잃음.
//  · 1등 적중: 판돈 ×(출전인원 − 2)  (5명 ×3, 6명 ×4 …)
//  · 2등: ×1.0 (본전)
//  · 3등: ×0.8 (약간 손해)
//  · 4등~: 0 (전액 잃음)
export const RACE_BET = {
  minRunners: 5, // 5명 이상일 때만 베팅 가능
  maxStake: 50, // 1회 최대 판돈
  dailyCount: 10, // 하루 최대 베팅 횟수
  dailyTotal: 300, // 하루 최대 베팅 합계(판돈)
} as const;

// 등수별 배당 배수 (출전인원 n).
export function racePayoutMult(place: number, n: number): number {
  if (place === 1) return Math.max(1, n - 2);
  if (place === 2) return 1.0;
  if (place === 3) return 0.8;
  return 0;
}
// 실제 지급액(정수). place 0/그외는 미적중.
export function racePayout(place: number, n: number, stake: number): number {
  return Math.round(racePayoutMult(place, n) * stake);
}

export type PointTx = {
  id: string;
  amount: number;
  reason: string;
  ref: string | null;
  created_at: string;
};
