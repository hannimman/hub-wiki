import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser, AuthError } from "@/lib/auth";
import { getAdminDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// 이미지 업로드 (multipart/form-data, field: file).
// 브라우저 → 이 API → Supabase Storage(wiki-images, private) — 망분리 호환 프록시.
// Netlify 함수 페이로드 한계(~6MB)를 고려해 5MB 캡.
const MAX_BYTES = 5 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

// 선언된 MIME 위조 방지 — 실제 바이트 시그니처(매직바이트)로 재검증.
// (다른 형식을 이미지로 속여 올리는 것 차단; SVG 등 스크립트 가능 형식은 애초에 미허용)
function matchesMagic(mime: string, buf: Buffer): boolean {
  if (buf.length < 12) return false;
  switch (mime) {
    case "image/png":
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/gif":
      return buf.subarray(0, 4).toString("ascii") === "GIF8";
    case "image/webp":
      return (
        buf.subarray(0, 4).toString("ascii") === "RIFF" &&
        buf.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File))
      throw new AuthError("업로드할 파일이 없습니다.", 400);

    const ext = EXT_BY_MIME[file.type];
    if (!ext)
      throw new AuthError("PNG/JPEG/GIF/WebP 이미지만 올릴 수 있습니다.", 400);
    if (file.size > MAX_BYTES)
      throw new AuthError("이미지는 5MB 이하여야 합니다.", 400);

    const buf = Buffer.from(await file.arrayBuffer());
    if (!matchesMagic(file.type, buf))
      throw new AuthError("이미지 파일이 아니거나 형식이 손상되었습니다.", 400);

    const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`;
    const db = getAdminDb();
    const { error } = await db.storage
      .from("wiki-images")
      .upload(path, buf, {
        contentType: file.type,
        upsert: false,
      });
    if (error) throw new Error("저장 실패: " + error.message);

    return NextResponse.json({ ok: true, url: `/api/files/${path}` });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("upload file error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
