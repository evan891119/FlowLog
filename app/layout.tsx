import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowLog",
  description: "A task dashboard for staying anchored in your current work state.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
