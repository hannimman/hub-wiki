import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { markRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// 알림 읽음 처리. body: { ids: string[] }
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? (body.ids as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    await markRead(user.id, ids);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("mark notifications read error", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
