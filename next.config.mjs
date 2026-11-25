import { Buffer } from "node:buffer"
import process from "node:process"
import { URL } from "node:url"
import nextConstants from "next/constants.js"

const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } =
  nextConstants
const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"])

function getUpstreamOrigin(value, production) {
  if (!value) {
    if (production) throw new Error("API_UPSTREAM_URL is required in production")
    return undefined
  }
  const upstream = URL.canParse(value) ? new URL(value) : null
  if (
    !upstream ||
    !["http:", "https:"].includes(upstream.protocol) ||
    upstream.username ||
    upstream.password ||
    upstream.pathname !== "/" ||
    upstream.search ||
    upstream.hash
  ) {
    throw new Error("API_UPSTREAM_URL must be an HTTP(S) origin without credentials, a path or query")
  }
  if (production && upstream.protocol !== "https:" && !loopbackHosts.has(upstream.hostname)) {
    throw new Error("API_UPSTREAM_URL must use HTTPS outside the local loopback")
  }
  return upstream.origin
}

/** @returns {import('next').NextConfig} */
export default function nextConfig(phase) {
  const development = phase === PHASE_DEVELOPMENT_SERVER
  const production = phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER
  const upstream = getUpstreamOrigin(process.env.API_UPSTREAM_URL, production)
  const publicApi = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (production && publicApi && publicApi !== "/api") {
    throw new Error("NEXT_PUBLIC_API_URL must be /api in production")
  }
  if (
    production &&
    Buffer.byteLength(process.env.AUTH_ROLE_COOKIE_SECRET?.trim() ?? "", "utf8") < 32
  ) {
    throw new Error("AUTH_ROLE_COOKIE_SECRET must have at least 32 bytes in production")
  }

  return {
    env: {
      NEXT_PUBLIC_API_URL:
        publicApi || (development && !upstream ? "http://localhost:3001" : "/api"),
    },
    images: { unoptimized: true },
    ...(upstream && {
      async rewrites() {
        return { fallback: [{ source: "/api/:path*", destination: upstream + "/:path*" }] }
      },
    }),
  }
}
