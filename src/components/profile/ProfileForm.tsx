"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Camera,
  Check,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_BUCKET } from "@/lib/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Profile, ProfilePreferences } from "@/types";

interface ProfileFormProps {
  profile: Profile;
  email: string;
}

const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function PreferenceRow({
  title,
  description,
  icon: Icon,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  icon: typeof Bell;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface2/50 px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Icon className="h-3.5 w-3.5" /> {title}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-primary" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState(profile.username);
  const [preferences, setPreferences] = useState<ProfilePreferences>(
    profile.preferences ?? {}
  );

  // undefined = untouched, null = remove, string = new uploaded path.
  const [avatarPath, setAvatarPath] = useState<string | null | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url ?? null
  );
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = initials(username || profile.username);

  function updatePreference(key: keyof ProfilePreferences, value: boolean) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function onPickAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Keep your photo under 2 MB.");
      return;
    }

    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const supabase = createClient();
      const path = `${profile.id}/avatar-${Date.now()}.${extensionFor(file.type)}`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      setAvatarPath(path);
      setAvatarPreview(URL.createObjectURL(file));
      setSaved(false);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "That photo could not be uploaded."
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  function removeAvatar() {
    setAvatarPath(null);
    setAvatarPreview(null);
    setAvatarError(null);
    setSaved(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          preferences,
          ...(avatarPath !== undefined ? { avatarPath } : {}),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Your profile could not be saved.");
      }
      setSaved(true);
      setAvatarPath(undefined);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Your profile could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-secondary/50 text-xl font-extrabold text-primary-deep ring-2 ring-primary/25 dark:text-primary-soft">
          {avatarPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarPreview}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setAvatarPreview(null)}
            />
          ) : (
            initial
          )}
          {avatarBusy && (
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] font-bold text-white">
              Uploading…
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{username || "friend"}</p>
          <p className="truncate text-xs text-muted">{email}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-muted">
            <UserRound className="h-3 w-3" /> Your LumiNest profile
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              size="sm"
              variant="soft"
              loading={avatarBusy}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" /> {avatarPreview ? "Change photo" : "Upload photo"}
            </Button>
            {avatarPreview && (
              <Button type="button" size="sm" variant="ghost" onClick={removeAvatar}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={onPickAvatar}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted">PNG, JPG or WebP · up to 2 MB.</p>
          {avatarError && (
            <p
              role="alert"
              className="mt-1 rounded-xl bg-[#E892A2]/15 px-2.5 py-1.5 text-[11px] font-medium text-[#a34b60] dark:text-[#f3b3c0]"
            >
              {avatarError}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Display name"
        value={username}
        onChange={(event) => {
          setUsername(event.target.value);
          setSaved(false);
        }}
        maxLength={40}
        autoComplete="nickname"
        hint="2–40 letters, numbers, spaces, dots, dashes or underscores."
      />

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-deep dark:text-primary-soft">
          Preferences
        </p>
        <PreferenceRow
          title="Notifications"
          description="Allow friendly reminders about processing and storage."
          icon={Bell}
          checked={preferences.notifications ?? false}
          onChange={(value) => updatePreference("notifications", value)}
        />
        <PreferenceRow
          title="Offer summaries"
          description="Show the summary prompt more prominently on file pages."
          icon={Sparkles}
          checked={preferences.autoSummary ?? false}
          onChange={(value) => updatePreference("autoSummary", value)}
        />
        <PreferenceRow
          title="Reduce motion"
          description="Lumi will keep her animations calm. Your device setting is always respected."
          icon={Wind}
          checked={preferences.reduceMotion ?? false}
          onChange={(value) => updatePreference("reduceMotion", value)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="inline-flex items-center gap-1 rounded-2xl bg-[#DDF3E8] px-3 py-2 text-xs font-medium text-[#2f7a5c]"
        >
          <Check className="h-3.5 w-3.5" /> Profile saved.
        </p>
      )}

      <Button type="submit" loading={saving} className="w-full sm:w-auto">
        <Save className="h-4 w-4" /> Save profile
      </Button>
    </form>
  );
}
