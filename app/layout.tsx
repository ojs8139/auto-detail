import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "상세페이지 자동 생성",
  description: "사용자가 등록한 로컬 이미지, 제품 설명 문서, 기존 쇼핑몰의 분위기(URL)를 바탕으로 쇼핑몰용 상품 상세페이지 이미지를 자동 생성하는 웹 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
