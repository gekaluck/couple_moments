import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
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
