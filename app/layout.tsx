import type { ReactNode } from "react";
import "./globals.css";
import "highlight.js/styles/github.css";
import SiteHeader from "./SiteHeader";
import CatalogExtras from "./CatalogExtras";
import { loadAndRegisterExtras } from "@/lib/avatar/catalog-db";

export const metadata = {
  title: "팀 위키",
  description: "사내 팀 위키",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // DB 커스텀 아이템을 서버 렌더 레지스트리에 등록 + 클라이언트에도 주입
  const extras = await loadAndRegisterExtras();

  return (
    <html lang="ko">
      <body>
        <CatalogExtras items={extras} />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
