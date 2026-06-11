import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/lib/avatars";
import { getPoints } from "@/lib/points";
import { listUnread } from "@/lib/notifications";
import LogoutButton from "./LogoutButton";
import GiftAlert from "./GiftAlert";

// 모든 페이지 상단 공용 헤더. 서버 컴포넌트로 현재 유저를 직접 읽는다.
// 미확인 알림(선물 등)은 매 페이지 렌더마다 조회 → 모달로 표시.
export default async function SiteHeader() {
  const user = await getCurrentUser();
  const [points, unread] = user
    ? await Promise.all([getPoints(user.id), listUnread(user.id)])
    : [0, [] as Awaited<ReturnType<typeof listUnread>>];

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
            <Link href="/me/shop" className="pts-chip" title="아바타 상점">
              🪙 {points.toLocaleString()}
            </Link>
            <Link className="btn btn-primary btn-sm" href="/wiki/new">
              ✏️ 새 글
            </Link>
            {user.role === "super" && (
              <Link className="btn btn-sm" href="/super">
                🦸 슈퍼
              </Link>
            )}
            {(user.role === "super" || user.role === "admin") && (
              <Link className="btn btn-sm" href="/admin">
                🛡️ 관리자
              </Link>
            )}
            <Link href="/me" className="hdr-user" title="마이페이지">
              <Avatar id={user.avatar} config={user.avatar_config} size={30} />
              <span className="uname">{user.display_name}</span>
            </Link>
            <LogoutButton />
            {unread.length > 0 && <GiftAlert items={unread} />}
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
