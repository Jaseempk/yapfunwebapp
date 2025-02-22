"use client";
import type React from "react";
import "./globals.css";
import Header from "./components/Header";
import { Providers } from "./providers";
import { Web3Provider } from "./providers/Web3Providers";

// export const metadata = {
//   title: "YapFun - Crypto Influencer Trading Platform",
//   description: "Trade on crypto influencer mindshare",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="relative antialiased">
        <Web3Provider>
          <Providers>
            <div className="min-h-screen bg-background">
              <Header />
              {children}
            </div>
          </Providers>
        </Web3Provider>
      </body>
    </html>
  );
}
