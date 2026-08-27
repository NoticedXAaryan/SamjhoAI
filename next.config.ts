import type { NextConfig } from 'next';
import { validateBuildEnvironment } from './src/config/env';

validateBuildEnvironment(process.env);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ['172.17.16.1'],
};

export default nextConfig;
