import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Troubleshoot",
  robots: { index: false, follow: false },
};

// Plain server-rendered page with inline styles and no client JS. It has to be
// readable on the same old browsers that might fail to open the app.
export default function CompatPage() {
  return (
    <div
      style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "32px 20px 56px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "#504465",
        lineHeight: 1.6,
      }}
    >
      <p style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 700, color: "#9388A5", textTransform: "uppercase" }}>
        LumiNest
      </p>
      <h1 style={{ fontSize: 23, margin: "6px 0 10px" }}>
        The installed app won’t open
      </h1>
      <p style={{ fontSize: 14, color: "#9388A5", margin: 0 }}>
        This is almost always an old app shortcut, not a problem with your files.
        Android saves the app’s launch address when you install it, and an older
        address no longer works. Reinstalling fixes it permanently.
      </p>

      <h2 style={{ fontSize: 16, marginTop: 26 }}>Fix it in 3 steps</h2>

      <ol style={{ fontSize: 14, color: "#504465", paddingLeft: 20 }}>
        <li style={{ marginBottom: 10 }}>
          <strong>Remove the old app.</strong> Press and hold the LumiNest icon →
          App info → Uninstall. (Settings → Apps → LumiNest → Uninstall also works.)
        </li>
        <li style={{ marginBottom: 10 }}>
          <strong>Open this page in Chrome:</strong>{" "}
          <Link href="/reset" style={{ color: "#8B72C9", fontWeight: 700 }}>
            /reset
          </Link>{" "}
          — it clears the old app cache automatically. Your files live on the
          server, so nothing is lost.
        </li>
        <li>
          <strong>Install again</strong> from Chrome’s menu → “Install app”.
        </li>
      </ol>

      <h2 style={{ fontSize: 16, marginTop: 26 }}>If that doesn’t work</h2>
      <p style={{ fontSize: 14, color: "#9388A5", margin: 0 }}>
        Update <strong>Android System WebView</strong> in the Play Store. On older
        phones this is the engine that runs installed web apps, and a stale copy
        can make them close immediately.
      </p>

      <p style={{ marginTop: 24, fontSize: 14, color: "#9388A5" }}>
        Installing the Android app for the first time?{" "}
        <Link
          href="/install-apk"
          style={{ color: "#8B72C9", fontWeight: 700 }}
        >
          Follow the install guide
        </Link>
        {" "}— it explains the “unknown apps” warning Android shows.
      </p>

      <p style={{ marginTop: 28 }}>
        <Link
          href="/home"
          style={{
            display: "inline-block",
            padding: "13px 24px",
            borderRadius: 999,
            background: "#B9A5EA",
            color: "#3D3153",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Use LumiNest in the browser
        </Link>
      </p>
    </div>
  );
}
