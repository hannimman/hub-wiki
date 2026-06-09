import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getPageId, updatePage, softDeletePage } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 문서 수정 (로그인 활성 사용자만)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const page = await getPageId(id);
    if (!page) throw new AuthError("문서를 찾을 수 없습니다.", 404);

    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "");
    const summary = String(body.summary ?? "").trim().slice(0, 200);
    const baseRevisionId = body.baseRevisionId
      ? String(body.baseRevisionId)
      : null;
    if (title.length < 1 || title.length > 200)
      throw new AuthError("제목은 1~200자여야 합니다.", 400);
    if (content.length > 200000)
      throw new AuthError("본문이 너무 깁니다.", 400);

    const result = await updatePage(
      user.id,
      id,
      title,
      content,
      summary,
      baseRevisionId
    );
    return NextResponse.json({ ok: true, slug: page.slug, changed: result.changed });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("update page error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// 문서 삭제 (소프트 삭제, 로그인 활성 사용자만)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const page = await getPageId(id);
    if (!page) throw new AuthError("문서를 찾을 수 없습니다.", 404);

    await softDeletePage(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("delete page error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
