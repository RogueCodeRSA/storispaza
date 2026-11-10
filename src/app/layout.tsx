import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoriSpaza — Every Story Has a Place",
  description: "A creator-led storytelling studio for illustrated English and Sesotho reading material.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
