import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ConvexClientProvider } from "@/components/convex-client-provided";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/providers";
import CursorGlow from "@/components/cursor-glow";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sharely",
  description: "Simplest way to split expenses between groups",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logos/logo.png" sizes="any" />
      </head>

      <body className={inter.className}>
        <Providers>
          <ClerkProvider>
            <ConvexClientProvider>
              {/* Global cursor */}
              <CursorGlow />

              {/* Global header */}
              <Header />

              {/* Page content */}
              <main className="min-h-screen pt-16">
                {children}
              </main>
            </ConvexClientProvider>
          </ClerkProvider>
        </Providers>
      </body>
    </html>
  );
}
