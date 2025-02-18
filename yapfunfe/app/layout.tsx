import type React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./components/Header";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "YapFun - Crypto Influencer Trading Platform",
  description: "Trade on crypto influencer mindshare",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} relative`}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
