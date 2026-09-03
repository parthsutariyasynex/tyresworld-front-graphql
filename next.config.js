/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  experimental: {
    optimizePackageImports: ["lucide-react", "swiper"],
  },
  // Bundle the brand logo tree into the /api/brands serverless function.
  // findBrandLogo() scans these files with fs at runtime; without this,
  // public/ assets aren't in the function's filesystem on Vercel, so no
  // brand ever resolves a logo and the Shop-by-Brands grid comes up empty.
  outputFileTracingIncludes: {
    "/api/brands": ["./public/brands/mgs_brand/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Magento store images (API product images)
      { protocol: "https", hostname: "autoono-demo.btire.com" },
      { protocol: "https", hostname: "tyrescart.ae" },
      { protocol: "https", hostname: "**.tyrescart.ae" },
      { protocol: "https", hostname: "www1.tyresworld.ae" },
      { protocol: "https", hostname: "www.tyresworld.ae" },
    ],
  },
};

module.exports = nextConfig;
