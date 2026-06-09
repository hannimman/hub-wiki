import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getPageId, restoreRevision } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 특정 리비전으로 복원 (로그인 활성 사용자만)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const page = await getPageId(id);
    if (!page) throw new AuthError("문서를 찾을 수 없습니다.", 404);

    const body = await req.json().catch(() => null);
    const revisionId = String(body?.revisionId ?? "");
    if (!revisionId) throw new AuthError("리비전 ID가 없습니다.", 400);

    await restoreRevision(user.id, id, revisionId);
    return NextResponse.json({ ok: true, slug: page.slug });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("restore page error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
