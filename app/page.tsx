import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="container page">
      <h1 style={{ fontSize: 30, margin: "8px 0 6px" }}>📚 팀 위키</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        사내 팀의 지식을 한곳에. 문서를 작성하고 함께 다듬어요.
      </p>

      {user ? (
        <div className="row" style={{ marginTop: 24, flexWrap: "wrap" }}>
          <Link href="/wiki" className="btn btn-primary">
            📖 위키 문서 보기
          </Link>
          <Link href="/wiki/new" className="btn">
            + 새 문서
          </Link>
          <Link href="/wiki/changes" className="btn">
            🕒 최근 변경
          </Link>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 24, maxWidth: 420 }}>
          <p style={{ marginTop: 0 }}>
            이 위키는 <b>로그인</b> 후 이용할 수 있어요. (읽기·쓰기 모두 로그인
            필요)
          </p>
          <Link href="/login" className="btn btn-primary">
            로그인
          </Link>
        </div>
      )}
    </main>
  );
}
