import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "木棉里 · 华工课表与校园墙",
  description: "连接五山、大学城与广州国际校区。安排课程，分享华园日常。独立学生项目。",
  openGraph: {
    title: "木棉里 · 华工课表与校园墙",
    description: "三座校园，同一种归属感。安排课程，分享华园日常。",
    url: "https://mumianli-scut-campus-2026.memily7.chatgpt.site",
    images: [{url: "https://mumianli-scut-campus-2026.memily7.chatgpt.site/og-cover.png", width: 1200, height: 630}],
    locale: "zh_CN",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
