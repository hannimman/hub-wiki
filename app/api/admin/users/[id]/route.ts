import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { updateUserFields } from "@/lib/admin";

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

    // 자기 자신 잠금 방지
    if (id === actor.id) {
      if ("role" in fields && fields.role !== "super")
        throw new AuthError("본인 역할은 변경할 수 없습니다.", 400);
      if ("is_active" in fields && !fields.is_active)
        throw new AuthError("본인 계정은 비활성화할 수 없습니다.", 400);
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
