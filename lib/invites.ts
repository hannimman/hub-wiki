import { getAdminDb } from "./db";
import { AuthError, type SessionUser } from "./auth";

// 초대 발급/조회/취소. (관리자: member 초대 / 슈퍼: admin 초대도 가능)

export type InviteRow = {
  id: string;
  token: string;
  role: "member" | "admin";
  email: string | null;
  expires_at: string;
  created_at: string;
};

export async function createInvite(
  actor: SessionUser,
  role: "member" | "admin",
  days: number,
  email?: string
): Promise<InviteRow> {
  if (role !== "member" && role !== "admin") {
    throw new AuthError("잘못된 역할입니다.", 400);
  }
  if (role === "admin" && actor.role !== "super") {
    throw new AuthError("관리자 초대는 슈퍼유저만 가능합니다.", 403);
  }
  const d = Math.min(Math.max(Math.round(Number(days) || 7), 1), 90);
  const expires = new Date(Date.now() + d * 86400000).toISOString();

  const db = getAdminDb();
  const { data, error } = await db
    .from("invites")
    .insert({
      role,
      email: email || null,
      created_by: actor.id,
      expires_at: expires,
    })
    .select("id, token, role, email, expires_at, created_at")
    .single();
  if (error || !data) throw new Error("초대 생성 실패: " + (error?.message ?? ""));
  return data as InviteRow;
}

export async function listInvites(): Promise<InviteRow[]> {
  const db = getAdminDb();
  const { data } = await db
    .from("invites")
    .select("id, token, role, email, expires_at, created_at")
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as InviteRow[];
}

export async function revokeInvite(id: string): Promise<void> {
  const db = getAdminDb();
  await db.from("invites").delete().eq("id", id).is("used_at", null);
}
