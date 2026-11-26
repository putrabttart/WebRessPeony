import type { Metadata } from "next";
import "./globals.css";
import peonyLogo from "../../logo_peony.jpg";

export const metadata: Metadata = {
  title: { default: "Peony", template: "%s | Peony" },
  description: "Peony Reseller Management System",
  icons: { icon: peonyLogo.src, apple: peonyLogo.src },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>;
}
