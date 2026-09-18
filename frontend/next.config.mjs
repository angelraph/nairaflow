/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    // wagmi's Base Account connector (pulled in transitively by RainbowKit's package entry,
    // even though this app doesn't use that connector) feature-detects Coinbase's x402
    // payment-protocol clients at runtime via try/catch-guarded dynamic imports — several
    // variants (core, evm/exact, evm/upto, svm/exact, ...). None of the "@x402/..." packages
    // it probes for are actually published, which fails webpack's static build-time
    // resolution even though the code only ever needs them to be absent gracefully. Ignoring
    // the whole "@x402/" namespace tells webpack to treat every one of these as an empty
    // module, matching how this already behaves at runtime wherever the packages are
    // genuinely uninstalled.
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// }));
    return config;
  },
};

export default nextConfig;
