import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { updateUserFields, getUserRole } from "@/lib/admin";

export const dynamic = "force-dynamic";

// 사용자 수정 (admin: is_active / super: role·can_rate·can_view_scores 포함)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const fields = await req.json().catch(() => null);
    if (!fields || typeof fields !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const isSuper = actor.role === "super";

    // 대상이 슈퍼유저면 오직 슈퍼유저만 관리 가능.
    // (관리자는 슈퍼유저 비활성화·비밀번호 초기화·역할변경 등 일절 불가)
    const targetRole = await getUserRole(id);
    if (!targetRole) throw new AuthError("대상 사용자를 찾을 수 없습니다.", 404);
    if (targetRole === "super" && !isSuper)
      throw new AuthError("슈퍼유저는 슈퍼유저만 관리할 수 있습니다.", 403);

    // 자기 자신 잠금 방지
    if (id === actor.id) {
      if ("role" in fields && fields.role !== "super")
        throw new AuthError("본인 역할은 변경할 수 없습니다.", 400);
      if ("is_active" in fields && !fields.is_active)
        throw new AuthError("본인 계정은 비활성화할 수 없습니다.", 400);
      if (fields.reset_password === true)
        throw new AuthError("본인 비밀번호는 마이페이지에서 변경하세요.", 400);
    }

    await updateUserFields(id, fields, isSuper);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("update user error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
