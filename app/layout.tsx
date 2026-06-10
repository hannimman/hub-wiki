import type { ReactNode } from "react";
import "./globals.css";
import "highlight.js/styles/github.css";
import SiteHeader from "./SiteHeader";

export const metadata = {
  title: "팀 위키",
  description: "사내 팀 위키",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
