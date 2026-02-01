import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Nav from "@/components/Nav";
import "../styles/design-system.css";
import "../styles/tokens.css";
import "../styles/god-mode.css";
import "../styles/marketplace.css";

export const metadata: Metadata = {
  title: "Infamous Freight",
  description: "AI-Powered Freight & Get Truck'N Marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="marketplace-body">
        <Nav />
        <main className="container marketplace-main">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
