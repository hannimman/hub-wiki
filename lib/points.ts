import { getAdminDb } from "./db";

// 포인트 적립 기본값 (서버 권위값)
export const POINTS = {
  signup: 1000, // 가입 환영 보너스
  attendance: 10,
  newDoc: 30,
  edit: 5,
  ratingReceived: 2,
  ratingGiven: 3,
} as const;

// 하루 캡(남용 방지)
export const DAILY_CAP = {
  new_doc: 3, // 새 문서 적립 하루 최대 3건
  edit: 5, // 수정 적립 하루 최대 5건
  rating_given: 10, // 평가 참여 하루 최대 10건
} as const;

// 적립 사유 → 사용자 표시 라벨 (이력 화면용). 새 출처 추가 시 여기에 라벨만 더하면 된다.
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

// KST 기준 오늘(YYYY-MM-DD)
function kstToday(): string {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}
// KST 오늘 00:00 의 UTC ISO (하루 캡 집계 시작점)
function kstDayStartIso(): string {
  return new Date(`${kstToday()}T00:00:00+09:00`).toISOString();
}

export async function getPoints(userId: string): Promise<number> {
  const db = getAdminDb();
  const { data } = await db
    .from("users")
    .select("points")
    .eq("id", userId)
    .maybeSingle();
  return data?.points ?? 0;
}

export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const db = getAdminDb();
  const { data } = await db
    .from("attendance")
    .select("day")
    .eq("user_id", userId)
    .eq("day", kstToday())
    .maybeSingle();
  return !!data;
}

// 출석. 반환: 이번에 적립된 포인트(0이면 오늘 이미 출석함)
export async function checkIn(userId: string): Promise<number> {
  const db = getAdminDb();
  const { data, error } = await db.rpc("check_in", {
    p_user: userId,
    p_amount: POINTS.attendance,
  });
  if (error) throw new Error("출석 처리 실패: " + error.message);
  return (data as number) ?? 0;
}

// 범용 적립/차감. reason 자유 → 어떤 출처든 재사용(유연). 음수면 차감.
export async function award(
  userId: string,
  amount: number,
  reason: string,
  ref?: string | null
): Promise<void> {
  const db = getAdminDb();
  const { error } = await db.rpc("award_points", {
    p_user: userId,
    p_amount: amount,
    p_reason: reason,
    p_ref: ref ?? null,
  });
  if (error) throw new Error("포인트 적립 실패: " + error.message);
}

// 오늘(KST) 특정 reason 적립 건수
export async function countTodayByReason(
  userId: string,
  reason: string
): Promise<number> {
  const db = getAdminDb();
  const { count } = await db
    .from("point_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("reason", reason)
    .gte("created_at", kstDayStartIso());
  return count ?? 0;
}

// 오늘(KST) 같은 reason+ref 로 이미 적립했는지 (예: 같은 문서 수정 하루 1회)
export async function alreadyAwardedTodayForRef(
  userId: string,
  reason: string,
  ref: string
): Promise<boolean> {
  const db = getAdminDb();
  const { data } = await db
    .from("point_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", reason)
    .eq("ref", ref)
    .gte("created_at", kstDayStartIso())
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function listTransactions(
  userId: string,
  limit = 50
): Promise<PointTx[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("point_transactions")
    .select("id, amount, reason, ref, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("포인트 이력 조회 실패: " + error.message);
  return (data ?? []) as PointTx[];
}

export async function listOwned(userId: string): Promise<string[]> {
  const db = getAdminDb();
  const { data } = await db
    .from("owned_items")
    .select("item_key")
    .eq("user_id", userId);
  return (data ?? []).map((r) => (r as { item_key: string }).item_key);
}

// 구매(원자적). 반환: 'ok' | 'owned' | 'insufficient'
export async function buyItem(
  userId: string,
  itemKey: string,
  cost: number
): Promise<"ok" | "owned" | "insufficient"> {
  const db = getAdminDb();
  const { data, error } = await db.rpc("buy_item", {
    p_user: userId,
    p_item: itemKey,
    p_cost: cost,
  });
  if (error) throw new Error("구매 처리 실패: " + error.message);
  return data as "ok" | "owned" | "insufficient";
}

// ── 슈퍼 지급 ── (amount 음수면 회수). reason: 'grant'(개별/선택) | 'event'(전체)
export async function grantToUsers(
  userIds: string[],
  amount: number,
  note: string
): Promise<number> {
  let n = 0;
  for (const id of userIds) {
    await award(id, amount, "grant", note || null);
    n++;
  }
  return n;
}

export async function grantToAll(
  amount: number,
  note: string
): Promise<number> {
  const db = getAdminDb();
  const { data } = await db.from("users").select("id").eq("is_active", true);
  const ids = (data ?? []).map((r) => (r as { id: string }).id);
  for (const id of ids) await award(id, amount, "event", note || null);
  return ids.length;
}
