import Link from "next/link";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main
      className="page"
      style={{ maxWidth: 380, margin: "0 auto", padding: "24px 20px 72px" }}
    >
      <h1>로그인</h1>
      <p className="muted" style={{ fontSize: 14 }}>
        가입은 관리자에게 받은 초대 링크로만 가능합니다.
      </p>
      <LoginForm />
      <p style={{ marginTop: 18, fontSize: 14 }}>
        <Link href="/reset">비밀번호를 잊으셨나요? 비밀번호 재설정</Link>
      </p>
    </main>
  );
}
