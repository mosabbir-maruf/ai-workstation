import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NETLIFY ? {} : { output: "standalone" }),
  agentRules: false,
  reactStrictMode: true,
  transpilePackages: ["@aiws/ui", "geist"],
  experimental: {
    // Keeps dev/prod from pulling the entire charts/icons/ui packages per page.
    optimizePackageImports: [
      "@aiws/ui",
      "@aiws/ui/charts",
      "@aiws/icons",
      "fumadocs-ui",
    ],
  },
};

export default withMDX(nextConfig);
