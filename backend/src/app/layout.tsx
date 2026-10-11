import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider, ConvexConnectionBanner } from "@/lib/convex";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Astraa Admin - Exam App Dashboard",
  description: "Admin dashboard for Astraa Exam App — ನಿಮ್ಮ ಯಶಸ್ಸಿನ ಅಸ್ತ್ರ",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ConvexConnectionBanner />
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
