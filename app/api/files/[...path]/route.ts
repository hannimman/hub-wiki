import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// 이미지 서빙 프록시 — Storage(private)에서 받아 스트리밍.
// 경로가 uuid 라 내용 불변 → 브라우저에 1년 immutable 캐시(재방문 대역폭 0).
const PATH_RE = /^\d{4}\/[0-9a-f-]{36}\.(png|jpg|gif|webp)$/;
const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    await requireUser(); // 조회도 로그인 필요 정책과 동일

    const { path } = await params;
    const full = (path ?? []).join("/");
    if (!PATH_RE.test(full))
      throw new AuthError("잘못된 파일 경로입니다.", 400);

    const db = getAdminDb();
    const { data, error } = await db.storage.from("wiki-images").download(full);
    if (error || !data) throw new AuthError("파일을 찾을 수 없습니다.", 404);

    const ext = full.split(".").pop()!;
    return new Response(data, {
      headers: {
        "content-type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("serve file error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
