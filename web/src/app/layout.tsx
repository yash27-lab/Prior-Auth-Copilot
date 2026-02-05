import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Prior Auth Copilot",
  description: "Doc → Fields → Decision → Next Step"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
