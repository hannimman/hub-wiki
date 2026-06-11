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
} as const;

export type PointConfig = {
  signup: number;
  attendance: number;
  newDoc: number;
  edit: number;
  ratingReceived: number;
  ratingGiven: number;
};

export const POINT_CONFIG_LABEL: Record<keyof PointConfig, string> = {
  signup: "가입 보너스",
  attendance: "출석 (1일 1회)",
  newDoc: "문서 작성 (하루 3회까지)",
  edit: "문서 수정 (문서당 하루 1회, 총 5회까지)",
  ratingReceived: "평가 받음 (건당)",
  ratingGiven: "평가 참여 (건당, 하루 10회까지)",
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
  buy: "상점 구매",
  grant: "슈퍼 지급",
  event: "이벤트 지급",
};

export type PointTx = {
  id: string;
  amount: number;
  reason: string;
  ref: string | null;
  created_at: string;
};
