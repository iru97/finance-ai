import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Finance AI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-24 text-center">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI-Powered Financial Research Assistant
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Get instant insights on stocks, analyze fundamentals, and make informed investment decisions with the help of advanced AI.
          </p>
          <div className="flex gap-4">
            <Link href="/chat">
              <Button size="lg">Start Researching</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">Learn More</Button>
            </Link>
          </div>
        </section>

        <section id="features" className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Data</CardTitle>
              <CardDescription>
                Access live market data from SEC EDGAR, Finnhub, and Yahoo Finance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get up-to-date stock prices, company filings, and financial statements without expensive data subscriptions.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Analysis</CardTitle>
              <CardDescription>
                Powered by Gemini 2.0 Flash and GPT-4.1
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fast classification with Gemini, deep synthesis with GPT-4.1. Cost-optimized for maximum value.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Natural Conversation</CardTitle>
              <CardDescription>
                Ask questions in plain English
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No complex queries needed. Just ask about any stock or market topic and get comprehensive answers.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Next.js, Vercel AI SDK, and Supabase
        </div>
      </footer>
    </div>
  );
}
