import type { ReactNode } from "react";

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
