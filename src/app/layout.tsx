import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance AI - Intelligent Financial Research",
  description: "AI-powered financial research assistant for stock analysis and market insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
