import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Duet",
  description: "Plan dates, save memories, and keep ideas together.",
  icons: {
    icon: [
      { url: "/duet-favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/duet-favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/duet-favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/duet-icon.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/duet-favicon-32.png",
    apple: "/duet-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return (
    <html lang="en">
      <head>
        {mapsApiKey ? (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places&loading=async`}
            strategy="beforeInteractive"
          />
        ) : null}
      </head>
      <body
        className={`${dmSans.variable} ${fraunces.variable} antialiased min-h-screen flex flex-col`}
      >
        <ErrorBoundary>
          <div className="flex-1">{children}</div>
        </ErrorBoundary>
        <footer className="mx-auto w-full max-w-[1220px] px-4 pb-6 pt-3 text-center text-xs text-[var(--text-tertiary)] md:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/70 px-3 py-1.5 backdrop-blur-sm">
            <Link href="/privacy" className="link-hover hover:text-[var(--text-primary)]">
              Privacy Policy
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/terms" className="link-hover hover:text-[var(--text-primary)]">
              Terms of Service
            </Link>
          </div>
        </footer>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid var(--panel-border)",
              boxShadow: "var(--shadow-lg)",
            },
          }}
        />
      </body>
    </html>
  );
}
