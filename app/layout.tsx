import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PORTAL｜我的網站入口",
  description: "把所有常用網站整理在一個清楚、好用的入口。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "PORTAL｜所有網站，一目了然。",
    description: "把散落各處的網站收進同一個入口。",
    images: [{ url: "/og.png", width: 1732, height: 908, alt: "PORTAL 我的網站入口" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
