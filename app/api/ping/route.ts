export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();

  let supabase: Record<string, unknown> = { checked: false };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      supabase = { checked: true, reachable: true, status: res.status };
    } catch (err) {
      supabase = { checked: true, reachable: false, error: String(err) };
    }
  }

  return Response.json(
    { ok: true, message: "Next.js API 응답 성공", time: now, supabase },
    { headers: { "cache-control": "no-store" } }
  );
}
