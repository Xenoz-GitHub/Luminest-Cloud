import type { Metadata } from "next";
import { hasSupabaseConfig } from "@/lib/auth";
import { SetupNotice } from "@/components/SetupNotice";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  if (!hasSupabaseConfig()) return <SetupNotice />;
  return <LoginForm next={searchParams.next} />;
}
