import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Reactivé pour le test local de l'installation PWA
  register: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.dropbox.com',
      },
    ],
  },
};

export default withPWA(nextConfig);
