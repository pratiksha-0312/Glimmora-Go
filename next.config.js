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
};

module.exports = nextConfig;
