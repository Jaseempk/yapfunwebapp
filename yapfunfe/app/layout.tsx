import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import dynamic from "next/dynamic";

// Dynamically import components with loading fallbacks
const Header = dynamic(() => import("./components/Header"), {
  loading: () => (
    <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b animate-pulse" />
  ),
  ssr: true,
});

const Footer = dynamic(() => import("./components/Footer"), {
  loading: () => (
    <div className="w-full h-20 bg-background/80 backdrop-blur-lg border-t animate-pulse" />
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
          <div className="flex flex-col min-h-screen">
            <ParticleBackground />
            <Header />
            <main className="pt-16 flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
