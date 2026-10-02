import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

// Typed structurally rather than as `Metadata` from "next": the App Router only needs this
// object's shape at build time, and the exact export path for that type has moved between
// Next.js versions.
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nairaflow-angelraphs-projects.vercel.app";
const description =
  "Non-custodial stablecoin savings circles (Ajo and Esusu) and goal vaults, with an agent that can only act inside limits you set.";

export const metadata = {
  metadataBase: new URL(site),
  title: { default: "NairaFlow: Save, Rotate, Grow", template: "%s" },
  description,
  applicationName: "NairaFlow",
  openGraph: {
    title: "NairaFlow: Save, Rotate, Grow",
    description,
    siteName: "NairaFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NairaFlow: Save, Rotate, Grow",
    description,
  },
};

export const viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-14 lg:px-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
