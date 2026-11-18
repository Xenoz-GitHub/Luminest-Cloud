import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import { BootSplash } from "@/components/BootSplash";
import { AppResilience } from "@/components/AppResilience";
import { PerformanceProvider } from "@/components/performance/PerformanceProvider";
import { PerformanceHint } from "@/components/performance/PerformanceHint";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "LumiNest — Your little space for everything",
    template: "%s · LumiNest",
  },
  description:
    "A cozy personal cloud library with smart file organization, beautiful document previews, AI summaries and branded sharing.",
  applicationName: "LumiNest",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LumiNest",
  },
  openGraph: {
    title: "LumiNest — Your little space for everything",
    description:
      "A cozy personal cloud library with previews, AI summaries and branded file sharing.",
    type: "website",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#B9A5EA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applied before first paint so theme, accent and Performance Mode never
// flash their default values on load.
const THEME_SCRIPT = `try{var t=localStorage.getItem('luminest-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';var a=localStorage.getItem('luminest-accent')||'lavender';document.documentElement.setAttribute('data-accent',a);var pm=localStorage.getItem('luminest-perf-mode');document.documentElement.setAttribute('data-perf',pm==='lite'?'lite':'normal');var standalone=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;if(standalone){document.documentElement.classList.add('pwa-standalone');}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ES5 polyfills MUST run synchronously: they patch APIs that the
            module bundle assumes exist. Deferring them would defeat the point. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/polyfills.js" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        {/* Static, no-JS-needed fallback. AppResilience hides it the moment
            React runs, so a failed boot shows a message instead of white. */}
        <div id="boot-fallback" aria-hidden="true">
          <div className="bf-dot">L</div>
          <p className="bf-title">Opening LumiNest…</p>
          <p className="bf-sub">
            If this stays, your browser may need an update.
          </p>
          <a className="bf-link" href="/compat">
            Troubleshoot
          </a>
        </div>
        <PerformanceProvider>
          <AppResilience />
          <div id="boot-splash" aria-hidden="true">
            <div className="boot-splash__inner">
              <div className="relative grid place-items-center">
                <div className="boot-splash__glow" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/states/welcome.png"
                  alt=""
                  className="boot-splash__mascot"
                />
              </div>
              <p className="boot-splash__title">LumiNest</p>
              <div className="boot-splash__bar">
                <span />
              </div>
            </div>
          </div>
          {children}
          <BootSplash />
          <PwaRegister />
          <PerformanceHint />
        </PerformanceProvider>
      </body>
    </html>
  );
}
