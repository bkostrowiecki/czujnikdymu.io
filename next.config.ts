import type { NextConfig } from "next";
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  sassOptions: {
    quietDeps: true
  },

  images: {
    domains: ['upload.wikimedia.org', 'localhost']
  },

  async rewrites() {
    return [
      {
        source: "/konto",
        destination: "/account"
      },
      {
        source: '/koncerty',
        destination: '/gigs'
      },
      {
        source: '/polityka-prywatnosci',
        destination: '/privacy-policy'
      },
      {
        source: '/regulamin',
        destination: '/rules',
      },
      {
        source: '/o-czujniku-dymu',
        destination: '/about'
      },
      {
        source: '/kontakt',
        destination: '/contact'
      },
      {
        source: '/wspolpraca',
        destination: '/cooperation'
      },
      {
        source: '/wsparcie',
        destination: '/support'
      },
      {
        source: '/miejsca',
        destination: '/places'
      },
      {
        source: '/miejsca/:id',
        destination: '/places/:id'
      },
      {
        source: '/wykonawcy',
        destination: '/artists'
      },
      {
        source: '/zaloguj-sie',
        destination: '/account/sign-in'
      }
    ]
  }
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
})

export default withMDX(nextConfig);
