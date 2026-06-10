import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/lib/avatars";
import { getPoints } from "@/lib/points";
import LogoutButton from "./LogoutButton";

// 모든 페이지 상단 공용 헤더. 서버 컴포넌트로 현재 유저를 직접 읽는다.
export default async function SiteHeader() {
  const user = await getCurrentUser();
  const points = user ? await getPoints(user.id) : 0;

  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="brand">
          📚 팀 위키
        </Link>

        {user && (
          <nav className="nav">
            <Link href="/wiki">문서</Link>
            <Link href="/wiki/changes">최근 변경</Link>
          </nav>
        )}

        <div className="spacer" />

        {user ? (
          <>
            <Link href="/me" className="pts-chip" title="내 포인트">
              🪙 {points.toLocaleString()}
            </Link>
            <Link className="btn btn-primary btn-sm" href="/wiki/new">
              ✏️ 새 글
            </Link>
            {(user.role === "super" || user.role === "admin") && (
              <Link
                className="btn btn-sm"
                href={user.role === "super" ? "/super" : "/admin"}
              >
                {user.role === "super" ? "🦸 슈퍼" : "🛡️ 관리자"}
              </Link>
            )}
            <Link href="/me" className="hdr-user" title="마이페이지">
              <Avatar id={user.avatar} config={user.avatar_config} size={30} />
              <span className="uname">{user.display_name}</span>
            </Link>
            <LogoutButton />
          </>
        ) : (
          <Link className="btn btn-primary btn-sm" href="/login">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
