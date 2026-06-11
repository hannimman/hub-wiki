import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import { hashPassword, createSession, AuthError } from "@/lib/auth";
import { sanitizeAvatarV2 } from "@/lib/avatar/render";
import { award, getPointConfig } from "@/lib/points";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

// 온보딩(초대 가입). "가입" 버튼을 눌러 이 API가 성공해야 초대코드가 used 처리된다.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);

    const token = String(body.token ?? "").trim();
    const displayName = String(body.displayName ?? "").trim();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    // 가입 시점엔 보유 아이템 0 → equipped 는 전부 null 로 강제(얼굴만 자유)
    const avatar = "v2";
    const avatarConfig = sanitizeAvatarV2(body.avatarConfig, new Set());

    if (!token) throw new AuthError("초대 토큰이 없습니다.", 400);
    if (displayName.length < 1 || displayName.length > 30)
      throw new AuthError("이름은 1~30자여야 합니다.", 400);
    if (!USERNAME_RE.test(username))
      throw new AuthError("아이디는 영문 소문자/숫자/. _ 3~20자여야 합니다.", 400);
    if (password.length < 8 || password.length > 100)
      throw new AuthError("비밀번호는 8자 이상이어야 합니다.", 400);

    const db = getAdminDb();
    const nowIso = new Date().toISOString();

    // 1) 아이디 중복 확인
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing) throw new AuthError("이미 사용 중인 아이디입니다.", 409);

    // 2) 초대 원자적 클레임 (1회용 + 유효기간 동시 검증)
    //    used_at is null AND expires_at > now 인 행만 갱신 → 동시 가입 경합 방지.
    const { data: claimed, error: claimErr } = await db
      .from("invites")
      .update({ used_at: nowIso })
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .select("id, role, created_by")
      .maybeSingle();
    if (claimErr) throw new AuthError("초대 처리 중 오류가 발생했습니다.", 500);
    if (!claimed)
      throw new AuthError("유효하지 않거나 만료/이미 사용된 초대입니다.", 400);

    // 3) 사용자 생성
    const password_hash = await hashPassword(password);
    const { data: user, error: insErr } = await db
      .from("users")
      .insert({
        username,
        display_name: displayName,
        password_hash,
        role: claimed.role,
        avatar,
        avatar_config: avatarConfig,
        invited_by: claimed.created_by,
      })
      .select("id")
      .single();

    if (insErr || !user) {
      // 롤백: 초대 클레임 해제 (다시 사용 가능하도록)
      await db.from("invites").update({ used_at: null }).eq("id", claimed.id);
      throw new AuthError("가입 처리 중 오류가 발생했습니다.", 500);
    }

    // 4) 초대에 사용자 기록
    await db.from("invites").update({ used_by: user.id }).eq("id", claimed.id);

    // 4.5) 가입 환영 포인트 (이력에도 기록). 실패해도 가입은 막지 않는다.
    try {
      const cfg = await getPointConfig();
      if (cfg.signup > 0) await award(user.id, cfg.signup, "signup");
    } catch (e) {
      console.error("signup bonus failed", e);
    }

    // 5) 세션 발급 (자동 로그인)
    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("signup error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
