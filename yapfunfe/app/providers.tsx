"use client";

import { ThemeProvider } from "next-themes";
import { ApolloProvider } from "./providers/ApolloProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </ApolloProvider>
  );
}
