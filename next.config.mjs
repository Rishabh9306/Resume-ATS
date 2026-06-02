/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin', 'pdf-parse', 'mammoth'],
  turbopack: {},
};

export default nextConfig;
