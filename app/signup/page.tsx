import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let invalid: string | null = null;
  let role: string | null = null;

  if (!token) {
    invalid = "초대 토큰이 없습니다. 올바른 초대 링크로 접속해주세요.";
  } else {
    const db = getAdminDb();
    const { data } = await db
      .from("invites")
      .select("role, used_at, expires_at")
      .eq("token", token)
      .maybeSingle();
    if (!data) invalid = "존재하지 않는 초대입니다.";
    else if (data.used_at) invalid = "이미 사용된 초대입니다.";
    else if (new Date(data.expires_at).getTime() < Date.now())
      invalid = "만료된 초대입니다.";
    else role = data.role as string;
  }

  return (
    <main
      className="page"
      style={{ maxWidth: 440, margin: "0 auto", padding: "24px 20px 72px" }}
    >
      <h1>가입하기</h1>
      {invalid ? (
        <div>
          <p style={{ color: "var(--danger)" }}>{invalid}</p>
          <p>
            계정이 있으신가요? <Link href="/login">로그인</Link>
          </p>
        </div>
      ) : (
        <SignupForm token={token!} role={role!} />
      )}
    </main>
  );
}
