/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: [
      'upload.wikimedia.org',
      'via.placeholder.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'encrypted-tbn0.gstatic.com',
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig