import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import { MainNavigation } from "@/components/main-navigation";
import { MainFooter } from "@/components/main-footer";
import { appName } from "@/const/app-name";
import { initializeSsrPb } from "./shared/pocketbase-ssr";
import { cookies } from "next/headers";
import { PocketBaseProvider } from "./shared/pocketbase-client-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: appName,
  description: appName,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pb = await initializeSsrPb();

  console.log(`RECORD `, pb.authStore.record);

  const cookiesReq = await cookies();

  const pbAuthCookie = cookiesReq.get("pb_auth");

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="vh-100">
          <PocketBaseProvider pbAuthCookieValue={pbAuthCookie?.value}>
            <MainNavigation userRecord={pb.authStore.record as any} />
            <div
              className="pt-5 d-flex flex-column justify-content-between"
              style={{ minHeight: "100%" }}
            >
              {children}
              <MainFooter userRecord={pb.authStore.record as any} />
            </div>
          </PocketBaseProvider>
        </div>
      </body>
    </html>
  );
}
