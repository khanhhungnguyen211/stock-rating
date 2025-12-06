/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are available by default in Next.js 14+
  // Cải thiện cache handling để tránh lỗi module
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Tăng timeout và cải thiện watch options cho webpack
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig

