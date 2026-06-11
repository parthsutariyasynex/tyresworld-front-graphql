/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Magento store images (API product images)
      { protocol: "https", hostname: "autoono-demo.btire.com" },
      { protocol: "https", hostname: "tyrescart.ae" },
      { protocol: "https", hostname: "**.tyrescart.ae" },
    ],
  },
};

module.exports = nextConfig;
