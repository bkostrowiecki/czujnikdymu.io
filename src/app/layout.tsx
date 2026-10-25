import type { Metadata } from "next";
import { Geist_Mono, Proza_Libre } from "next/font/google";
import "./globals.scss";
import { cookies } from "next/headers";
import { MainFooter } from "@/components/main-footer";
import { MainNavigation } from "@/components/main-navigation";
import { appName } from "@/const/app-name";
import { FavoritesProvider } from "./shared/favorites-provider";
import { PocketBaseProvider } from "./shared/pocketbase-client-provider";
import { initializeSsrPb } from "./shared/pocketbase-ssr";

const prozaLibre = Proza_Libre({
  variable: "--font-proza-libre",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
    <html lang="en" data-bs-theme="dark">
      <body className={`${prozaLibre.variable} ${geistMono.variable}`}>
        <div className="vh-100">
          <PocketBaseProvider pbAuthCookieValue={pbAuthCookie?.value}>
            <FavoritesProvider userId={pb.authStore.record?.id ?? null}>
              <MainNavigation userRecord={pb.authStore.record as any} />
              <div
                className="pt-5 d-flex flex-column justify-content-between app-content-container"
                style={{ minHeight: "100%" }}
              >
                {children}
                <MainFooter userRecord={pb.authStore.record as any} />
              </div>
            </FavoritesProvider>
          </PocketBaseProvider>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var r of regs) { r.unregister(); }
                });
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var k of keys) { caches.delete(k); }
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
