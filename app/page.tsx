import PingTest from "./PingTest";

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 680,
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1>📚 팀 위키 (Next.js 단계)</h1>
      <p>
        Next.js 기반으로 재구성된 첫 배포입니다. 아래는{" "}
        <b>브라우저 → Next.js API → Supabase</b> 경로 확인입니다.
      </p>
      <PingTest />
    </main>
  );
}
