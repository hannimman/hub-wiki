import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { restorePage } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 휴지통 문서 복원. body: { parentId?: string | null } — 미지정/null 은 최상위.
// (/restore 는 리비전 복원이 선점하고 있어 경로를 분리)
// 삭제와 동일하게 로그인 사용자 누구나 가능.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parentId =
      typeof body?.parentId === "string" && body.parentId ? body.parentId : null;

    await restorePage(id, parentId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("untrash page error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
