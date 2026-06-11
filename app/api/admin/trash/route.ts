import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { listTrash, hardDeletePage } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 휴지통 비우기 (관리자 전용) — 휴지통의 모든 항목을 영구 삭제.
export async function DELETE() {
  try {
    await requireAdmin();
    const items = await listTrash();
    let removed = 0;
    for (const t of items) {
      try {
        await hardDeletePage(t.id);
        removed++;
      } catch (e) {
        console.error("empty trash: failed to purge", t.id, e);
      }
    }
    return NextResponse.json({ ok: true, removed, total: items.length });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("empty trash error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
