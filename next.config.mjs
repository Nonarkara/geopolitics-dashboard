import path from "node:path";

const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        basePath: "/geopolitics-dashboard",
        images: { unoptimized: true },
      }
    : {}),
  transpilePackages: [
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/aggregation-layers",
    "@deck.gl/geo-layers",
    "@deck.gl/mapbox",
    "@deck.gl/react",
    "@luma.gl/core",
    "@luma.gl/engine",
    "@luma.gl/webgl",
    "@luma.gl/constants",
    "@loaders.gl/core",
  ],
  turbopack: {},
  env: {
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
      process.env.MAPBOX_ACCESS_TOKEN ??
      "",
    NEXT_PUBLIC_ENABLE_DATA_EXPLORER:
      process.env.NEXT_PUBLIC_ENABLE_DATA_EXPLORER ?? "",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(process.cwd(), "src"),
    };

    return config;
  },
};

export default nextConfig;
