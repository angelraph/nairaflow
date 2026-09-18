import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

// Typed structurally rather than as `Metadata` from "next" — the App Router only needs this
// object's shape at build time, and the exact export path for that type has moved between
// Next.js versions.
export const metadata = {
  title: "NairaFlow",
  description: "Non-custodial stablecoin savings circles and goal vaults for the African diaspora.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
