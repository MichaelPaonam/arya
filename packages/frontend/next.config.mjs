/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@arya/agents"],
  experimental: {
    serverComponentsExternalPackages: [
      "@0gfoundation/0g-ts-sdk",
      "ethers",
      "@upstash/redis",
      "@langchain/langgraph",
      "@langchain/openai",
      "@langchain/core",
      "openai",
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      encoding: false,
    };

    // Resolve .js imports to .ts source files for the agents package
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".js"],
    };

    return config;
  },
};

export default nextConfig;
