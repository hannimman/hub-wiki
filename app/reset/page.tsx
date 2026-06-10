import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";

export default function ResetPage() {
  return (
    <main
      className="page"
      style={{ maxWidth: 380, margin: "0 auto", padding: "24px 20px 72px" }}
    >
      <h1>비밀번호 재설정</h1>
      <ResetForm />
    </main>
  );
}
