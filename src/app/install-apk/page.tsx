import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Install LumiNest",
  description: "How to install the LumiNest Android app.",
  robots: { index: false, follow: false },
};

// Deliberately plain: inline styles, no client JS. This page is reached from a
// phone that may be struggling, so it must render on the oldest browser we
// support. Written for Android 8 through Android 15.

const card = {
  border: "2px solid #E9E0F5",
  borderRadius: 18,
  padding: "16px 18px",
  marginTop: 14,
  background: "#fff",
} as const;

const code = {
  background: "#F7F2FF",
  padding: "1px 5px",
  borderRadius: 5,
} as const;

export default function InstallApkPage() {
  return (
    <div
      style={{
        maxWidth: 460,
        margin: "0 auto",
        padding: "28px 20px 60px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "#504465",
        lineHeight: 1.6,
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          fontWeight: 700,
          color: "#9388A5",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        LumiNest
      </p>
      <h1 style={{ fontSize: 24, margin: "6px 0 8px", lineHeight: 1.25 }}>
        Install the app on Android
      </h1>
      <p style={{ fontSize: 14, color: "#9388A5", margin: 0 }}>
        Four short steps. Android will warn you once that the file is not from
        the Play Store. That is normal, and step 3 explains it.
      </p>

      <a
        href="/luminest.apk"
        download="luminest.apk"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          marginTop: 20,
          padding: "15px 18px",
          borderRadius: 18,
          border: "2px solid #8B72C9",
          background: "#B9A5EA",
          color: "#3D3153",
          textDecoration: "none",
          boxShadow: "0 10px 24px rgba(139, 114, 201, 0.22)",
        }}
      >
        <span>
          <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>
            Download LumiNest
          </span>
          <span
            style={{
              display: "block",
              marginTop: 2,
              fontSize: 12,
              fontWeight: 600,
              color: "#4B3F62",
            }}
          >
            Android 5.0+ &middot; 2.7 MB &middot; version 1.0.0
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 22, fontWeight: 800 }}>
          &darr;
        </span>
      </a>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 12,
          color: "#9388A5",
          textAlign: "center",
        }}
      >
        Signed release APK. No account or Play Store needed to download it.
      </p>

      <div style={card}>
        <strong style={{ fontSize: 15 }}>1. Get the file</strong>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>
          Tap <strong>Download LumiNest</strong> above. Your phone saves{" "}
          <code style={code}>luminest.apk</code> to its{" "}
          <strong>Downloads</strong> folder. The file is 2.7 MB, so Wi-Fi is
          easiest if your mobile data is limited.
        </p>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 15 }}>2. Tap the file</strong>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>
          Open your <strong>Files</strong> or <strong>Downloads</strong> app, find{" "}
          <code style={code}>luminest.apk</code>, and tap it. If your phone asks
          which app to use, pick <em>Package installer</em>.
        </p>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 15 }}>3. Allow the install</strong>
        <p style={{ margin: "6px 0 10px", fontSize: 14 }}>
          Android shows a warning such as <em>&ldquo;For your security, your phone
          is not allowed to install unknown apps from this source.&rdquo;</em>{" "}
          This is the standard warning for any app outside the Play Store.
        </p>

        <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14 }}>
          <li style={{ marginBottom: 6 }}>
            Tap <strong>Settings</strong> on that warning.
          </li>
          <li style={{ marginBottom: 6 }}>
            Turn on <strong>Allow from this source</strong> (Android 8&ndash;9
            calls it <strong>Install unknown apps</strong>).
          </li>
          <li style={{ marginBottom: 6 }}>
            Press <strong>Back</strong> to return to the installer.
          </li>
          <li>
            Tap <strong>Install</strong>.
          </li>
        </ol>

        <p style={{ margin: "12px 0 0", fontSize: 13, color: "#9388A5" }}>
          Only the app you tapped gets this permission, not everything on your
          phone. You can switch it back off later in Settings, Apps, Special
          access, Install unknown apps.
        </p>
      </div>

      <div
        style={{
          border: "2px solid #F3C677",
          background: "#FFF8E6",
          borderRadius: 18,
          padding: "16px 18px",
          marginTop: 18,
          fontSize: 14,
        }}
      >
        <strong style={{ fontSize: 15 }}>If Play Protect says &ldquo;unsafe app&rdquo;</strong>
        <p style={{ margin: "6px 0 0" }}>
          You may see <em>Unsafe app blocked</em>. That happens because the app is
          not distributed through Google Play. Choose <strong>More details</strong>{" "}
          then <strong>Install anyway</strong>. The APK is signed with a private
          key that only you control.
        </p>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 15 }}>4. Open LumiNest</strong>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>
          The icon appears on your home screen. Tap it and sign in as usual. Your
          files live on the server, so the same nest appears on any device.
        </p>
      </div>

      <h2 style={{ fontSize: 17, marginTop: 30 }}>If it will not install</h2>
      <ul style={{ fontSize: 14, paddingLeft: 20, marginTop: 8 }}>
        <li style={{ marginBottom: 8 }}>
          <strong>App not installed</strong> &mdash; an older LumiNest is still on
          the phone. Uninstall it first: Settings, Apps, LumiNest, Uninstall.
        </li>
        <li style={{ marginBottom: 8 }}>
          <strong>Problem parsing the package</strong> &mdash; the download was
          incomplete. Delete the file and download it again.
        </li>
        <li style={{ marginBottom: 8 }}>
          <strong>Nothing happens on tap</strong> &mdash; open the file from
          Chrome&apos;s Downloads page instead of your file manager.
        </li>
        <li>
          <strong>The switch is greyed out</strong> &mdash; a work profile or
          parental control is blocking it. Try outside that profile.
        </li>
      </ul>

      <p style={{ marginTop: 26, fontSize: 14 }}>
        Prefer not to install anything?{" "}
        <Link href="/open" style={{ color: "#8B72C9", fontWeight: 700 }}>
          Use LumiNest in your browser
        </Link>{" "}
        &mdash; it works exactly the same.
      </p>

      <p style={{ marginTop: 10, fontSize: 14 }}>
        <Link href="/compat" style={{ color: "#8B72C9", fontWeight: 700 }}>
          Something still wrong? Open troubleshooting
        </Link>
      </p>
    </div>
  );
}
