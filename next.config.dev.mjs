/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Temporalmente comentado para desarrollo
  // output: 'export',
  // trailingSlash: true,
  // distDir: 'out',
  // basePath: "/inventario",
  // assetPrefix: "/inventario",
  
  // Configuración para desarrollo estable
  reactStrictMode: false,
  swcMinify: true,
}

export default nextConfig
