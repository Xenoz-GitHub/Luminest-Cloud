import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Mascot } from "@/components/mascot/Mascot";

export function SetupNotice() {
  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <Mascot expression="thinking" size={130} glow />
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          Lumi needs her keys
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Supabase is not configured yet. Copy{" "}
          <code className="rounded bg-surface2 px-1.5 py-0.5 text-xs">.env.example</code>{" "}
          to <code className="rounded bg-surface2 px-1.5 py-0.5 text-xs">.env.local</code>{" "}
          and add your project URL and anon key.
        </p>
        <div className="mt-5 w-full space-y-2 rounded-2xl bg-surface2 p-4 text-left text-xs text-muted">
          <p className="font-semibold text-ink">Required to sign in</p>
          <p>NEXT_PUBLIC_SUPABASE_URL</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          <p className="pt-1 text-[11px]">
            Then run the migration in{" "}
            <code className="text-ink">supabase/migrations/</code>.
          </p>
        </div>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button variant="secondary" disabled className="w-full">
            Auth is waiting for configuration
          </Button>
          <a
            href="/"
            className="text-xs font-semibold text-primary-deep underline-offset-4 hover:underline dark:text-primary-soft"
          >
            Back to the landing page
          </a>
        </div>
        <Logo href={null} size="sm" className="mt-6 opacity-70" />
      </div>
    </Card>
  );
}
