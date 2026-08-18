import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YAJEN HUB｜雅真匯",
  description: "我的網站，一站匯聚。雅真的個人網站入口。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "YAJEN HUB｜雅真匯",
    description: "我的網站，一站匯聚。",
    images: [{ url: "/og-yajen.png", width: 1536, height: 1024, alt: "YAJEN HUB 雅真匯" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-yajen.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
