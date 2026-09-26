import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@aiws/ui", "geist"],
  viewTransition: true,
  experimental: {
    // Keeps dev/prod from pulling the entire charts package per page.
    optimizePackageImports: ["@aiws/ui", "@aiws/ui/charts"],
  },
};

export default withMDX(nextConfig);
