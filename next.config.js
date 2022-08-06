/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images:{
    domains: ['kutty.netlify.app']
  }
}

module.exports = nextConfig
