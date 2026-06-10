import { getAdminDb } from "./db";
import type { Role } from "./auth";
import type { AvatarConfig } from "./avatars";

// 사용자 관리 서버 로직. (super: 전체 / admin: is_active 등 일부)

export type AdminUser = {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  is_active: boolean;
  can_rate: boolean;
  can_view_scores: boolean;
  needs_password_reset: boolean;
  avatar: string;
  avatar_config: AvatarConfig | null;
  created_at: string;
};

export async function listUsers(): Promise<AdminUser[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("users")
    .select(
      "id, username, display_name, role, is_active, can_rate, can_view_scores, needs_password_reset, avatar, avatar_config, created_at"
    )
    .order("created_at", { ascending: true });
  if (error) throw new Error("사용자 조회 실패: " + error.message);
  return (data ?? []) as AdminUser[];
}

// 대상 사용자의 역할 조회 (권한 검사용). 없으면 null.
export async function getUserRole(id: string): Promise<Role | null> {
  const db = getAdminDb();
  const { data } = await db
    .from("users")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  return (data?.role as Role) ?? null;
}

// 필드 화이트리스트 갱신. role/can_rate/can_view_scores 는 슈퍼만.
export async function updateUserFields(
  targetId: string,
  fields: Record<string, unknown>,
  isSuper: boolean
): Promise<void> {
  const patch: Record<string, unknown> = {};

  if ("is_active" in fields) patch.is_active = !!fields.is_active;

  // 비밀번호 초기화: 관리자·슈퍼 공통. true 일 때만 플래그를 세운다.
  if (fields.reset_password === true) patch.needs_password_reset = true;

  if (isSuper) {
    if (
      "role" in fields &&
      ["super", "admin", "member"].includes(String(fields.role))
    ) {
      patch.role = fields.role;
    }
    if ("can_rate" in fields) patch.can_rate = !!fields.can_rate;
    if ("can_view_scores" in fields)
      patch.can_view_scores = !!fields.can_view_scores;
  }

  if (Object.keys(patch).length === 0) return;

  const db = getAdminDb();
  const { error } = await db.from("users").update(patch).eq("id", targetId);
  if (error) throw new Error("사용자 수정 실패: " + error.message);
}

// 슈퍼 수 (마지막 슈퍼 강등 방지용)
export async function countSupers(): Promise<number> {
  const db = getAdminDb();
  const { count } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "super");
  return count ?? 0;
}

// 분석/통계
export async function getStats(): Promise<{
  users: number;
  pages: number;
  revisions: number;
  ratings: number;
}> {
  const db = getAdminDb();
  const head = { count: "exact" as const, head: true };
  const [u, p, r, rt] = await Promise.all([
    db.from("users").select("id", head),
    db.from("pages").select("id", head).eq("is_deleted", false),
    db.from("page_revisions").select("id", head),
    db.from("ratings").select("id", head),
  ]);
  return {
    users: u.count ?? 0,
    pages: p.count ?? 0,
    revisions: r.count ?? 0,
    ratings: rt.count ?? 0,
  };
}
