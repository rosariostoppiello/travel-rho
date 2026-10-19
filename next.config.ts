import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Para abrir el servidor local desde el celu en la misma wifi
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
};

export default nextConfig;
