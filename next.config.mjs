
let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config.js').catch(() => null)
} catch (e) {
  // ignore error
}

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
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // Ensure the app runs even if fonts aren't available
  optimizeFonts: false
}

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return nextConfig
  }

  const merged = { ...nextConfig }
  
  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      merged[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      merged[key] = userConfig[key]
    }
  }
  
  return merged
}

export default mergeConfig(nextConfig, userConfig)
