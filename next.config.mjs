import million from "million/compiler";

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    async rewrites() {
        return {
            fallback: [{
                source: "/:doc*", // Matches any URL with path /<anything>
                destination: `http://localhost:3001/:doc*`, // Will route the request internally to /docs/build/documentation/<anything>
            }],
        };
    },
};

export default million.next(nextConfig);
