import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Peony", template: "%s | Peony" },
  description: "Peony Reseller Management System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>;
}
