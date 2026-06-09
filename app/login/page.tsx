import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 380,
  margin: "60px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export default function LoginPage() {
  return (
    <main style={wrap}>
      <h1>로그인</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        가입은 관리자에게 받은 초대 링크로만 가능합니다.
      </p>
      <LoginForm />
    </main>
  );
}
