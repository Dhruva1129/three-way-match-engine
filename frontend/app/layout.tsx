import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Three-Way Match Engine",
  description: "PO / GRN / Invoice reconciliation console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-ink-900 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
