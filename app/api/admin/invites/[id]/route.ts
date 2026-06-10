import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { revokeInvite } from "@/lib/invites";

export const dynamic = "force-dynamic";

// 초대 취소 (미사용 초대만, 관리자 이상)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await revokeInvite(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("revoke invite error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
