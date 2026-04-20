import Link from "next/link";
import {
  Leaf,
  BarChart3,
  ArrowRight,
  Sparkles,
  Camera,
  FileImage,
  Type,
  TrendingDown,
  Lightbulb,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Camera,
    title: "Live Camera Scanning",
    description:
      "Point your camera at any product, meal, or item and get real-time carbon footprint analysis powered by Gemini AI.",
    span: "sm:col-span-2",
    accent: true,
  },
  {
    icon: FileImage,
    title: "Receipt & Photo Scanning",
    description:
      "Upload receipts, grocery bags, or photos of anything — AI identifies items and estimates their carbon impact.",
  },
  {
    icon: Sparkles,
    title: "Gemini AI Analysis",
    description:
      "Google Gemini vision models identify products and calculate lifecycle CO₂e using environmental research data.",
  },
  {
    icon: TrendingDown,
    title: "Track Your Trend",
    description:
      "Watch your carbon footprint change over time with monthly charts and category breakdowns.",
  },
  {
    icon: Lightbulb,
    title: "Smart Swap Suggestions",
    description:
      "Every high-impact item comes with a lower-carbon alternative and the exact CO₂ you'd save.",
  },
  {
    icon: Type,
    title: "Manual Item Entry",
    description:
      "No camera? Just type what you bought and get instant carbon estimates for each item.",
  },
  {
    icon: BarChart3,
    title: "Category Breakdown",
    description:
      "See which categories — meat, dairy, produce — contribute most to your footprint.",
  },
  {
    icon: Globe,
    title: "Built for Earth Day",
    description:
      "A practical tool for everyday climate action. Small changes, compounded, make a planet-sized difference.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
  span,
  accent,
}: (typeof features)[0]) {
  return (
    <div
      className={cn(
        "group border-border bg-card hover:border-primary/30 relative flex flex-col gap-4 rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg",
        span,
        accent && "bg-primary/5 border-primary/20"
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          accent
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300"
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-foreground text-base font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
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

export default function Home() {
  return (
    <main>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Leaf className="h-6 w-6 text-primary" />
            Carbon Lens
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="w-full p-4 pt-20 pb-12">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
            AI-powered carbon footprint tracking
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
            See the carbon cost of{" "}
            <span className="text-primary">everything</span> you buy.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg sm:text-xl">
            Point your camera at any product, upload a receipt, or type what you
            bought. Gemini AI estimates the carbon footprint of each item and
            suggests lower-impact swaps.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" className="text-base" asChild>
              <Link href="/dashboard">
                Start Scanning Free <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full px-4 py-14">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-10 max-w-5xl">
            <p className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
              Features
            </p>
            <h2 className="text-3xl tracking-tight md:text-4xl">
              Everything you need to track your impact.
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Scan anything — receipts, products, meals — and get instant carbon
              intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="w-full px-4 py-14">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-8 max-w-5xl">
            <p className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
              Live preview
            </p>
            <h2 className="text-3xl tracking-tight md:text-4xl">
              Every item, color-coded by impact.
            </h2>
            <p className="text-muted-foreground mt-2">
              Instantly see which items have the biggest footprint — and what to
              swap them for.
            </p>
          </div>

          <div className="grid gap-3">
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
      <section className="w-full px-4 py-14">
        <div className="bg-primary/5 border-primary/20 mx-auto w-full max-w-5xl rounded-2xl border p-12 text-center">
          <Leaf className="mx-auto mb-6 h-12 w-12 text-primary" />
          <h2 className="text-3xl font-semibold tracking-tight">
            Ready to see your carbon footprint?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
            It takes 30 seconds. Scan anything, see results instantly.
          </p>
          <div className="mt-8">
            <Button size="lg" className="text-base" asChild>
              <Link href="/register">
                Get Started — It&apos;s Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
