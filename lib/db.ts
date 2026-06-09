import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 서버 전용 Supabase 클라이언트 (service_role 키 → RLS 우회).
//
// 보안 주의:
//   * 절대 클라이언트 컴포넌트("use client")에서 import 하지 말 것.
//   * service 키는 NEXT_PUBLIC_ 접두사가 없으므로 Next.js가 브라우저 번들에 넣지 않는다.
//     (만약 실수로 import 돼도 process.env.SUPABASE_SERVICE_KEY 는 브라우저에서 undefined)
//   * 모든 접근 제어(조회 공개 / 쓰기는 인증된 활성 멤버)는 이 클라이언트를 쓰는
//     서버 코드가 책임진다. RLS는 직접 접근만 차단한다.

let cached: SupabaseClient | null = null;

export function getAdminDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다."
    );
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
