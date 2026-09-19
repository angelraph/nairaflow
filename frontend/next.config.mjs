/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    // wagmi's Base Account connector is pulled in transitively by RainbowKit's package entry,
    // even though this app doesn't use that connector. It feature-detects Coinbase's x402
    // payment-protocol clients at runtime through try/catch-guarded dynamic imports, several
    // variants (core, evm/exact, evm/upto, svm/exact, and so on). None of the "@x402/..."
    // packages it probes for are actually published, so webpack's static build-time
    // resolution fails even though the code only ever needs them to be absent gracefully.
    // Ignoring the whole "@x402/" namespace tells webpack to treat every one of these as an
    // empty module, matching how this already behaves at runtime wherever the packages are
    // genuinely uninstalled.
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// }));
    return config;
  },
};

export default nextConfig;
