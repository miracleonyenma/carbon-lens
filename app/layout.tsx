import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sileo";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemedToaster } from "@/components/themed-toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carbon Lens",
  description:
    "See the carbon cost of every purchase. AI-powered receipt scanning for a sustainable future.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" enableSystem enableColorScheme>
          <NextTopLoader showSpinner={false} />
          <TooltipProvider>
            <AuthProvider>{children}</AuthProvider>
          </TooltipProvider>
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
