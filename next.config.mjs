/** @type {import('next').NextConfig} */
const { withMonorepoPrismaWorkaround } = require('@prisma/nextjs-monorepo-workaround-plugin')

const nextConfig = {
  output: 'standalone', // required for serverless deployments

  webpack(config, { isServer }) {
    // --- SVG Handling ---
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...(fileLoaderRule.resourceQuery?.not || []), /url/] },
        use: ['@svgr/webpack'],
      }
    );

    // Modify the file loader rule to ignore *.svg
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

// Wrap with Prisma plugin to ensure Query Engine is copied
module.exports = withMonorepoPrismaWorkaround(nextConfig);
