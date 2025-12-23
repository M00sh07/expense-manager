import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { FEATURES, STEPS, TESTIMONIALS } from "@/lib/landing";

export default function LandingPage() {
  return (
    <div className="flex flex-col pt-16">

      {/* ───── Hero (UPDATED LAYOUT ONLY) ───── */}
      <section className="mt-20 pb-20 px-5">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* LEFT: Text */}
            <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Split expenses. Simplify life.
              </Badge>

              <h1 className="gradient-title text-4xl font-bold md:text-6xl lg:text-7xl">
                The simplest way to split expenses with friends
              </h1>

              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl lg:mx-0">
                Track shared expenses, split bills effortlessly, and settle up
                quickly. Never worry about who owes who again.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-700">
                  <Link href="/dashboard">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-accent"
                >
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
            </div>

            {/* RIGHT: Image */}
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10 p-6 md:p-10">
              <div className="rounded-xl bg-background shadow-2xl overflow-hidden">
                <Image
                  src="/logos/temp.png"
                  width={1400}
                  height={900}
                  alt="Splitzy dashboard preview"
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───── Features (UNCHANGED) ───── */}
      <section id="features" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Features
          </Badge>

          <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
            Everything you need to split expenses
          </h2>

          <p className="mx-auto mt-3 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Our platform provides all the tools you need to handle shared
            expenses with ease.
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, Icon, bg, color, description }) => (
              <Card
                key={title}
                className="flex flex-col items-center space-y-4 p-6 text-center bg-card text-card-foreground"
              >
                <div className={`rounded-full p-3 ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>

                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How it works (UNCHANGED) ───── */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            How It Works
          </Badge>

          <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
            Splitting expenses has never been easier
          </h2>

          <p className="mx-auto mt-3 max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Follow these simple steps to start tracking and splitting expenses
            with friends.
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {STEPS.map(({ label, title, description }) => (
              <div key={label} className="flex flex-col items-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xl font-bold">
                  {label}
                </div>

                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-muted-foreground text-center">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials (UNCHANGED) ───── */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Testimonials
          </Badge>

          <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
            What our users are saying
          </h2>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, role, image }) => (
              <Card key={name} className="flex flex-col justify-between bg-card text-card-foreground">
                <CardContent className="space-y-4 p-6">
                  <p className="text-muted-foreground">{quote}</p>

                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={image} alt={name} />
                      <AvatarFallback className="uppercase">
                        {name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-left">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Footer (UNCHANGED) ───── */}
      <footer className="border-t bg-muted/50 py-12 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Splitzy. All rights reserved.
      </footer>
    </div>
  );
}
