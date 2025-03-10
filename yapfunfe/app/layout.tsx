import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import dynamic from "next/dynamic";

// Dynamically import components with loading fallbacks
const Header = dynamic(() => import("./components/Header"), {
  loading: () => (
    <div className="h-16 bg-background/80 backdrop-blur-lg border-b animate-pulse" />
  ),
  ssr: true,
});

const ParticleBackground = dynamic(
  () => import("./components/ParticleBackground"),
  {
    loading: () => <div className="fixed inset-0 bg-background" />,
    ssr: false,
  }
);

export const metadata: Metadata = {
  title: "yapfun | Trade KOL Mindshare",
  description: "Trade KOL Mindshare on yapfun",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
        <Providers>
          <ParticleBackground />
          <Header />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
