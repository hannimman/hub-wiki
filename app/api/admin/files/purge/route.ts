import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { purgeOrphanImages } from "@/lib/files";

export const dynamic = "force-dynamic";

// 고아 이미지 삭제 (관리자 전용). body: { paths: string[] }
// 서버가 고아 여부를 재검증해 "지금도 미참조인 파일"만 지운다.
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const paths = Array.isArray(body?.paths)
      ? (body.paths as unknown[]).filter((p): p is string => typeof p === "string")
      : [];
    if (paths.length === 0)
      throw new AuthError("삭제할 파일이 없습니다.", 400);

    const removed = await purgeOrphanImages(paths);
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("purge orphan files error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
