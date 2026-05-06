import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ['172.17.16.1'],
};

export default nextConfig;
