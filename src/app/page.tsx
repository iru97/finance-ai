import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, TrendingUp, BarChart3, MessageSquare, Shield, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Real-Time Data',
    description: 'SEC EDGAR, Finnhub & Yahoo Finance',
    detail: 'Access live market data, company filings, and financial statements from multiple free sources.',
  },
  {
    icon: Zap,
    title: 'Intelligent Analysis',
    description: 'Gemini 2.0 Flash + GPT-4.1',
    detail: 'Fast classification with Gemini, deep synthesis with GPT-4.1. Cost-optimized for value.',
  },
  {
    icon: MessageSquare,
    title: 'Natural Conversation',
    description: 'Plain English queries',
    detail: 'No complex syntax needed. Just ask about any stock or market topic naturally.',
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-text-primary">Finance AI</span>
          </div>
          <nav className="flex items-center gap-3">
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
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-subtle/30 to-transparent" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text-secondary">
                <Shield className="h-4 w-4 text-success" />
                Free financial data APIs
              </div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                AI-Powered Financial
                <span className="text-accent"> Research Assistant</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed">
                Get instant insights on stocks, analyze fundamentals, and make informed investment decisions with the help of advanced AI models.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Start Researching
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-border bg-surface py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-text-primary">
                Everything you need for financial research
              </h2>
              <p className="mt-4 text-text-secondary">
                Powered by free APIs and cost-optimized AI models
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Card key={i} variant="elevated">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-subtle">
                      <feature.icon className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {feature.detail}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold text-text-primary">
              Ready to start researching?
            </h2>
            <p className="mt-4 text-text-secondary">
              Create a free account and start analyzing stocks in seconds.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-text-tertiary">
            Built with Next.js, Vercel AI SDK, and Supabase
          </p>
        </div>
      </footer>
    </div>
  )
}
