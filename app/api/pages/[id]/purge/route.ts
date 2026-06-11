import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { hardDeletePage } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 영구 삭제 (관리자 전용) — 휴지통(is_deleted) 문서만 가능. 복구 불가.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await hardDeletePage(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("purge page error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
