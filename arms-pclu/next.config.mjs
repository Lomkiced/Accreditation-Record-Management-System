/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const nextConfig = {
  reactStrictMode: true,

  // Allow Prisma to run in Node.js runtime (not Edge).
  // In Next.js 14.x the key is experimental.serverComponentsExternalPackages.
  // (Renamed to top-level serverExternalPackages in Next.js 15+.)
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
    // Tree-shake barrel-file packages that Next.js can't optimize automatically.
    // Without this, importing a single icon from lucide-react pulls the entire library.
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
