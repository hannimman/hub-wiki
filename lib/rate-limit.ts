// 간단한 인메모리 레이트리밋 — 로그인/재설정/가입 무차별 대입 완화용.
//
// 한계(의도된 트레이드오프): 서버리스 함수 인스턴스별 메모리라서 인스턴스가
// 여러 개면 인스턴스 수만큼 허용량이 늘어난다. 팀 위키 규모에서는 충분한
// 완화이고, 외부 저장소(Redis 등) 없이 무료 구조를 유지한다.

type Bucket = { times: number[] };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10000; // 메모리 보호

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    if (buckets.size >= MAX_BUCKETS) buckets.clear(); // 극단 상황 보호
    b = { times: [] };
    buckets.set(key, b);
  }
  b.times = b.times.filter((t) => now - t < windowMs);
  if (b.times.length >= max) {
    const retryAfterSec = Math.ceil((windowMs - (now - b.times[0])) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  b.times.push(now);
  return { ok: true, retryAfterSec: 0 };
}

// 프록시(Netlify) 뒤에서 클라이언트 IP 추출
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
