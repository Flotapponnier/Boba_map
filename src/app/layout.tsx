import type { Metadata, Viewport } from "next";
import { Nunito, Quicksand } from "next/font/google";
import { PWAInstallPrompt, ServiceWorkerRegistration } from "@/components";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Boba - Find anything on the map",
  description: "Search for places, events, and services using natural language",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Boba",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F59E0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${quicksand.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
