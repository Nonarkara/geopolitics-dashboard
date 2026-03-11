import path from "node:path";

const nextConfig = {
  env: {
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
      process.env.MAPBOX_ACCESS_TOKEN ??
      "",
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
