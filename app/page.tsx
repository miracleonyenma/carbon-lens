import Link from "next/link";
import { Leaf, ScanLine, BarChart3, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Leaf className="h-6 w-6 text-primary" />
            Carbon Lens
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Powered by Google Gemini AI
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              See the carbon cost of{" "}
              <span className="text-primary">every purchase</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Upload your grocery receipts and instantly see the carbon
              footprint of each item. Get smarter swaps, track trends, and make
              your shopping more sustainable.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start Scanning Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-full border px-8 font-medium transition-colors hover:bg-muted"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <StepCard
                step={1}
                icon={<ScanLine className="h-8 w-8" />}
                title="Upload a receipt"
                description="Take a photo of your grocery receipt or type in your items manually."
              />
              <StepCard
                step={2}
                icon={<Sparkles className="h-8 w-8" />}
                title="AI analyzes impact"
                description="Gemini identifies each item and estimates its carbon footprint using lifecycle data."
              />
              <StepCard
                step={3}
                icon={<BarChart3 className="h-8 w-8" />}
                title="Track & improve"
                description="See trends, get lower-carbon swap suggestions, and reduce your footprint over time."
              />
            </div>
          </div>
        </section>

        {/* Impact colors demo */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Every item, color-coded
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-muted-foreground">
              Instantly see which items have the biggest impact on your
              footprint
            </p>
            <div className="mx-auto grid max-w-2xl gap-3">
              <DemoItem
                name="Organic spinach"
                carbon="0.3 kg"
                level="low"
                swap={null}
              />
              <DemoItem
                name="Cheddar cheese (500g)"
                carbon="6.8 kg"
                level="medium"
                swap="Try plant-based cheese — save 5.2 kg CO₂"
              />
              <DemoItem
                name="Ground beef (1 kg)"
                carbon="27.0 kg"
                level="high"
                swap="Try lentils or mushroom mince — save 25.5 kg CO₂"
              />
              <DemoItem
                name="Oat milk (1L)"
                carbon="0.9 kg"
                level="low"
                swap={null}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-primary/5 py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <Leaf className="mx-auto mb-6 h-12 w-12 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to see your carbon footprint?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              It takes 30 seconds. Upload a receipt, see results instantly.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            Carbon Lens
          </div>
          <p>Built for Earth Day 2026 🌍</p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border bg-card p-8 text-center">
      <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {step}
      </div>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

const impactStyles = {
  low: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
  medium: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
  high: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
};

const impactEmoji = { low: "🟢", medium: "🟡", high: "🔴" };

function DemoItem({
  name,
  carbon,
  level,
  swap,
}: {
  name: string;
  carbon: string;
  level: "low" | "medium" | "high";
  swap: string | null;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border-l-4 p-4 text-left sm:flex-row sm:items-center sm:justify-between ${impactStyles[level]}`}
    >
      <div>
        <span className="font-medium">
          {impactEmoji[level]} {name}
        </span>
        {swap && (
          <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
            🌱 {swap}
          </p>
        )}
      </div>
      <span className="font-bold">{carbon} CO₂</span>
    </div>
  );
}
