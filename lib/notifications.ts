import { getAdminDb } from "./db";

// 알림함 — 수신자가 다음 페이지 이동/새로고침 때 모달로 확인한다.
// (실시간 푸시 없이도 "어딘가 접속할 때 감지"를 충족 — 공용 헤더가 매 요청 조회)

export type AppNotification = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export async function addNotification(
  userId: string,
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  const db = getAdminDb();
  const { error } = await db
    .from("notifications")
    .insert({ user_id: userId, type, payload });
  if (error) console.error("notification insert failed", error.message);
}

export async function listUnread(userId: string): Promise<AppNotification[]> {
  const db = getAdminDb();
  const { data } = await db
    .from("notifications")
    .select("id, type, payload, created_at")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: true })
    .limit(20);
  return (data ?? []) as AppNotification[];
}

export async function markRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = getAdminDb();
  await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId) // 본인 것만
    .in("id", ids);
}
