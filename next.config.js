/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-leaflet@4 doesn't survive Strict Mode's double-mount in dev
  // ("Map container is already initialized"). Prod builds don't double-mount.
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/p/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
