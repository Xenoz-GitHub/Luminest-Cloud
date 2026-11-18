import type { Metadata } from "next";
import { hasSupabaseConfig } from "@/lib/auth";
import { SetupNotice } from "@/components/SetupNotice";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create your nest" };

export default function SignupPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />;
  return <SignupForm />;
}
