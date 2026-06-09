import type { ReactNode } from "react";
import "./globals.css";
import "highlight.js/styles/github.css";

export const metadata = {
  title: "팀 위키",
  description: "사내 팀 위키",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
