import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // não revela a tecnologia do servidor nos cabeçalhos das respostas
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default nextConfig;
