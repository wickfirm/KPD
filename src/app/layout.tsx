import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kasumigaseki Properties Development",
    template: "%s | Kasumigaseki Properties Development",
  },
  description:
    "Kasumigaseki Properties Development creates disciplined, long-horizon real estate destinations in Dubai.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
