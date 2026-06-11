"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "👥 사용자" },
  { href: "/admin/activity", label: "📝 활동·기여" },
  { href: "/admin/ratings", label: "⭐ 평가" },
  { href: "/admin/content", label: "🩺 콘텐츠" },
  { href: "/admin/points", label: "🪙 포인트" },
  { href: "/admin/files", label: "🧹 이미지 정리" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
        borderBottom: "1px solid var(--border)",
        margin: "12px 0 20px",
      }}
    >
      {TABS.map((t) => {
        const active =
          t.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              padding: "8px 14px",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: active ? 700 : 400,
              color: active ? "var(--fg, #111)" : "var(--muted)",
              borderBottom: active
                ? "2px solid #3b82f6"
                : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
