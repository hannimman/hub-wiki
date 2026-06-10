import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { updateFolder } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 폴더 이름변경/이동 (로그인 활성 사용자 누구나)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      throw new AuthError("잘못된 요청입니다.", 400);

    const title =
      body.title === undefined ? undefined : String(body.title ?? "");
    const parentId =
      body.parentId === undefined
        ? undefined
        : body.parentId
        ? String(body.parentId)
        : null;

    await updateFolder(id, title, parentId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("update folder error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
