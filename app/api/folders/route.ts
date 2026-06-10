import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { createFolder } from "@/lib/pages";

export const dynamic = "force-dynamic";

// 폴더 생성 (로그인 활성 사용자 누구나)
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) throw new AuthError("잘못된 요청입니다.", 400);

    const title = String(body.title ?? "").trim();
    const parentId = body.parentId ? String(body.parentId) : null;
    if (title.length < 1 || title.length > 200)
      throw new AuthError("폴더 이름은 1~200자여야 합니다.", 400);

    const folder = await createFolder(user.id, title, parentId);
    return NextResponse.json({ ok: true, ...folder });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("create folder error", e);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
