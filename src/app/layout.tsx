import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import { MainNavigation } from "@/components/main-navigation";
import { MainFooter } from "@/components/main-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CzujnikDymu.app",
  description: "CzujnikDymu.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="vh-100">
          <MainNavigation />
          <div className="pt-5 d-flex flex-column justify-content-between" style={{ minHeight: '100%' }}>
          {children}
          <MainFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
