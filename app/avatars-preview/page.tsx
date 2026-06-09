import { AVATARS, Avatar } from "@/lib/avatars";

// 임시: 아바타 디자인 확인용 페이지. (/avatars-preview)
// 온보딩 연결 후 제거하거나 재활용 예정.
export default function AvatarsPreviewPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <h1>🎨 아바타 미리보기 ({AVATARS.length}종)</h1>
      <p>온보딩(가입) 화면에서 이 중 하나를 고르게 할 예정이에요.</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        {AVATARS.map((a) => (
          <div
            key={a.id}
            style={{
              border: "1px solid #e2e2e2",
              borderRadius: 12,
              padding: 12,
              textAlign: "center",
            }}
          >
            <Avatar id={a.id} size={96} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{a.label}</div>
            <div style={{ color: "#888", fontSize: 12 }}>{a.id}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
