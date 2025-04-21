import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  eslint: {
    // Вимикаємо перевірку ESLint під час збірки
    ignoreDuringBuilds: true,
  },};

module.exports = nextConfig
export default nextConfig;
