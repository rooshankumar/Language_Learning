let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config.js').catch(() => null)
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable server-side rendering for pages with Firebase Auth
  experimental: {
    serverComponentsExternalPackages: ['firebase'],
  },
  // Avoid build issues with client-only components
  compiler: {
    styledComponents: true,
  },
  // If needed, add output config
  output: 'standalone',
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
  // optimizeFonts option removed as it's not supported in Next.js 15.2.0
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