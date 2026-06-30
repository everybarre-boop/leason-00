import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "레슨 문의",
  description: "레슨 문의 리드 수집 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
