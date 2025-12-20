/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Bu satırı mutlaka ekleyin
  images: {
    unoptimized: true, // GitHub Pages için resim optimizasyonunu kapatmanız gerekir
  },
}

module.exports = nextConfig