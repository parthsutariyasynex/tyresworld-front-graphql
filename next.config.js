/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  experimental: {
    optimizePackageImports: ["lucide-react", "swiper"],
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
