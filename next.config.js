/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images:{
    domains: ['kutty.netlify.app']
  }
}

module.exports = nextConfig
