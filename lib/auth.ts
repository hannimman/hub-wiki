import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getAdminDb } from "./db";
import type { AvatarConfig } from "./avatars";

// ──────────────────────────────────────────────
// 자체 인증 (Supabase Auth 미사용 — 브라우저가 supabase.co 직접 호출 불가하므로).
// 비밀번호: bcrypt 해시. 세션: httpOnly 쿠키에 서명된 JWT.
// 보안 경계는 전적으로 서버 코드(이 모듈 + 각 라우트)에 있다.
// ──────────────────────────────────────────────

const COOKIE_NAME = "hubwiki_session";
const ALG = "HS256";
const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 10;

export type Role = "super" | "admin" | "member";

export type SessionUser = {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  avatar: string;
  avatar_config: AvatarConfig | null;
  is_active: boolean;
  can_rate: boolean;
  can_view_scores: boolean;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET 환경변수가 없거나 너무 짧습니다.");
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// 로그인 성공 시 호출: 세션 쿠키 발급
export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// 쿠키 → JWT 검증 → DB에서 현재 사용자 로드.
// DB의 is_active 를 매번 확인하므로 "비활성화"가 즉시 반영된다.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let uid: string | undefined;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    uid = typeof payload.uid === "string" ? payload.uid : undefined;
  } catch {
    return null; // 위조/만료 토큰
  }
  if (!uid) return null;

  const db = getAdminDb();
  const { data, error } = await db
    .from("users")
    .select(
      "id, username, display_name, role, avatar, avatar_config, is_active, can_rate, can_view_scores"
    )
    .eq("id", uid)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return data as SessionUser;
}

// 쓰기 가드: 로그인한 활성 사용자만 통과 (관리자/멤버 공통)
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("로그인이 필요합니다.", 401);
  return user;
}

// 관리자 전용 가드
// 관리자 이상(super 포함) 가드
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "super") {
    throw new AuthError("관리자 권한이 필요합니다.", 403);
  }
  return user;
}

// 슈퍼유저 전용 가드
export async function requireSuper(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "super") {
    throw new AuthError("슈퍼유저 권한이 필요합니다.", 403);
  }
  return user;
}
