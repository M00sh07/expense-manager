"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { BarLoader } from "react-spinners";
import { Authenticated, Unauthenticated } from "convex/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "./theme-toggle";

export default function Header() {
  const { isLoading } = useStoreUser();
  const path = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {mounted && (
            <Image
              src="/logos/logo_final.png"
              alt="Splitzy Logo"
              width={650}
              height={400}
              className="h-26 md:h-26 w-auto object-contain transition-transform hover:scale-110"
              priority
            />
          )}
        </Link>

        {path === "/" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-primary transition"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-primary transition"
            >
              How It Works
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          <Authenticated>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2 hover:text-primary hover:border-primary transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>

              <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </Authenticated>

          <Unauthenticated>
            <SignInButton>
              <Button variant="ghost" className="border-border">
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton>
              <Button className="bg-primary hover:bg-primary/90 border-none">
                Get Started
              </Button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </nav>

      {isLoading && <BarLoader width="100%" color="#36d7b7" />}
    </header>
  );
}
