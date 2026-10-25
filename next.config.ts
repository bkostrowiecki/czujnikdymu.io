import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  sassOptions: {
    quietDeps: true,
  },

  images: {
    domains: ["upload.wikimedia.org", "localhost"],
  },

  async rewrites() {
    return [
      {
        source: "/index.html",
        destination: "/",
      },
      {
        source: "/konto",
        destination: "/account",
      },
      {
        source: "/moderacja",
        destination: "/moderation",
      },
      {
        source: "/scrapper",
        destination: "/scrapper",
      },
      {
        source: "/scapper",
        destination: "/scrapper",
      },
      {
        source: "/koncerty",
        destination: "/gigs",
      },
      {
        source: "/koncerty/:id",
        destination: "/gigs/:id",
      },
      {
        source: "/polityka-prywatnosci",
        destination: "/privacy-policy",
      },
      {
        source: "/regulamin",
        destination: "/rules",
      },
      {
        source: "/o-czujniku-dymu",
        destination: "/about",
      },
      {
        source: "/kontakt",
        destination: "/contact",
      },
      {
        source: "/wspolpraca",
        destination: "/cooperation",
      },
      {
        source: "/wsparcie",
        destination: "/support",
      },
      {
        source: "/miejsca",
        destination: "/places",
      },
      {
        source: "/miejsca/:id",
        destination: "/places/:id",
      },
      {
        source: "/wykonawcy",
        destination: "/artists",
      },
      {
        source: "/wykonawcy/:id",
        destination: "/artists/:id",
      },
      {
        source: "/zaloguj-sie",
        destination: "/account/sign-in",
      },
      {
        source: "/gatunek/:slug",
        destination: "/genre/:slug",
      },
      {
        source: "/gatunki/:slug",
        destination: "/genre/:slug",
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

export default withMDX(nextConfig);
