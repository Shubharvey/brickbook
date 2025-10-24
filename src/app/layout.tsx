import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";
import { AuthProvider } from "../contexts/AuthContext";
import { registerSW } from "../lib/pwa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrickBook - Construction Business Management",
  description:
    "Complete business management solution for construction material dealers. Track customers, sales, payments, and generate reports.",
  keywords: [
    "BrickBook",
    "Construction",
    "Business Management",
    "Inventory",
    "Sales Tracking",
    "Payment Management",
  ],
  authors: [{ name: "BrickBook Team" }],
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BrickBook",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "BrickBook - Construction Business Management",
    description:
      "Complete business management solution for construction material dealers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrickBook - Construction Business Management",
    description:
      "Complete business management solution for construction material dealers",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Register service worker
  if (typeof window !== "undefined") {
    registerSW();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f97316" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
