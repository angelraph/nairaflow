const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nairaflow-angelraphs-projects.vercel.app";

export default function sitemap() {
  const paths = ["", "/circles", "/vaults", "/score", "/activity", "/docs", "/faq"];
  return paths.map((p) => ({ url: `${site}${p}`, lastModified: new Date() }));
}
