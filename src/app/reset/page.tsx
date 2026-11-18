import type { Metadata } from "next";
import { ResetClient } from "./ResetClient";

export const metadata: Metadata = {
  title: "Repair LumiNest",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return <ResetClient />;
}
