import type { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { LaunchRedirect } from "./LaunchRedirect";

export const metadata: Metadata = {
  title: "LumiNest",
  robots: { index: false, follow: false },
};

// Always rendered fresh so the auth decision is accurate, and always returns
// 200: no redirects on the installed app's launch path.
export const dynamic = "force-dynamic";

export default async function LaunchPage() {
  let signedIn = false;
  try {
    const { user } = await getOptionalUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }

  // Client-side hand-off keeps the standalone window alive. A server redirect
  // here is what makes some Android launchers close the app instantly.
  return <LaunchRedirect to={signedIn ? "/home" : "/login"} />;
}
