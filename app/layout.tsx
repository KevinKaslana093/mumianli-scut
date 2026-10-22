import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "木棉里 · 华工课表与校园墙",
  description: "连接五山、大学城与广州国际校区。安排课程，分享华园日常。独立学生项目。",
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
