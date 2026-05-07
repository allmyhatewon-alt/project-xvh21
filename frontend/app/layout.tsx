import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono, JetBrains_Mono, Press_Start_2P, Syne, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AudioPlayer } from "@/components/AudioPlayer/AudioPlayer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});
const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});
const syne = Syne({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-syne",
});
const bricolage = Bricolage_Grotesque({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Pengelus",
  description: "Creator profiles, live rooms, clips, and community.",
  openGraph: {
    title: "Pengelus",
    description: "Creator profiles, live rooms, clips, and community.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070c15",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-skin="peng_os" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐧</text></svg>'
        />
      </head>
      <body
        className={`${inter.variable} ${spaceMono.variable} ${jetBrainsMono.variable} ${pressStart.variable} ${syne.variable} ${bricolage.variable}`}
      >
        <Providers>
          {children}
          <AudioPlayer />
        </Providers>
      </body>
    </html>
  );
}
