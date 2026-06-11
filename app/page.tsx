import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getVillageMembers, pickSceneByTime } from "@/lib/home";
import TeamVillage from "./TeamVillage";

export const dynamic = "force-dynamic";

// 루트 — 팀 마을. 로그인하지 않아도 마을은 보인다(문서는 로그인 필요).
export default async function HomePage() {
  const [user, members] = await Promise.all([
    getCurrentUser(),
    getVillageMembers(),
  ]);
  const scene = pickSceneByTime();

  return (
    <main className="container page">
      <h1 style={{ fontSize: 30, margin: "8px 0 6px" }}>📚 팀 위키</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        사내 팀의 지식을 한곳에. 우리 팀이 마을에서 기다리고 있어요.
      </p>

      <TeamVillage members={members} scene={scene} />

      {user ? (
        <div className="row" style={{ flexWrap: "wrap" }}>
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
        <div className="row" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/login" className="btn btn-primary">
            로그인
          </Link>
          <span className="muted" style={{ fontSize: 13 }}>
            마을 구경은 누구나, 문서는 로그인 후 이용할 수 있어요.
          </span>
        </div>
      )}
    </main>
  );
}
