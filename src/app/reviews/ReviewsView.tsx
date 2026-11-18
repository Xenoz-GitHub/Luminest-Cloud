"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StarDisplay, StarInput } from "@/components/ui/StarRating";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewsView({
  signedIn,
  userId,
  reviews,
  myReview,
}: {
  signedIn: boolean;
  userId: string | null;
  reviews: Review[];
  myReview: Review | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [title, setTitle] = useState(myReview?.title ?? "");
  const [body, setBody] = useState(myReview?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const summary = useMemo(() => {
    if (!reviews.length) return { average: 0, count: 0, buckets: [0, 0, 0, 0, 0] };
    const buckets = [0, 0, 0, 0, 0];
    let total = 0;
    for (const review of reviews) {
      total += review.rating;
      const index = Math.min(4, Math.max(0, Math.round(review.rating) - 1));
      buckets[index] += 1;
    }
    return {
      average: total / reviews.length,
      count: reviews.length,
      buckets,
    };
  }, [reviews]);

  const showForm = signedIn && (!myReview || editing);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (rating < 1) {
      setError("Pick a star rating first.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Tell us a little more — at least 10 characters.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title.trim() || null, body: body.trim() }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Your review could not be saved.");
      }
      setSuccess(true);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setRemoving(true);
    try {
      const response = await fetch("/api/reviews", { method: "DELETE" });
      if (!response.ok) throw new Error("Your review could not be removed.");
      setRating(0);
      setTitle("");
      setBody("");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-extrabold leading-none text-ink">
              {summary.count ? summary.average.toFixed(1) : "—"}
            </p>
            <StarDisplay value={summary.average} size="md" className="mt-1.5" />
            <p className="mt-1 text-[11px] font-semibold text-muted">
              {summary.count} {summary.count === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="min-w-[180px] flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.buckets[stars - 1];
              const percent = summary.count
                ? Math.round((count / summary.count) * 100)
                : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="flex w-8 items-center gap-0.5 text-[10px] font-semibold text-muted">
                    {stars}
                    <Star className="h-2.5 w-2.5 fill-current" />
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
                    <div
                      className="h-full rounded-full bg-[#E8BE6A]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[10px] text-muted">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {!signedIn && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/25 bg-primary/5 p-5">
          <div>
            <p className="text-sm font-bold text-ink">Have a nest already?</p>
            <p className="mt-0.5 text-xs text-muted">
              Sign in to leave your own rating and review.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/login?next=/reviews"
              className="inline-flex h-10 items-center rounded-full border-2 border-line bg-surface px-4 text-xs font-bold text-ink transition hover:bg-surface2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-xs font-bold text-primary-ink shadow-toony-primary transition hover:bg-primary-deep hover:text-white"
            >
              Make a nest
            </Link>
          </div>
        </Card>
      )}

      {signedIn && myReview && !editing && (
        <Card className="border-primary/25 bg-primary/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary-deep dark:text-primary-soft">
                Your review
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StarDisplay value={myReview.rating} size="md" />
                <span className="text-sm font-bold text-ink">
                  {myReview.rating}.0
                </span>
              </div>
              {myReview.title && (
                <p className="mt-1 text-sm font-bold text-ink">{myReview.title}</p>
              )}
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {myReview.body}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="soft" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={removing}
                onClick={remove}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-ink">
            {myReview ? "Edit your review" : "Share your experience"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Honest, specific reviews help others decide.
          </p>

          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <StarInput value={rating} onChange={setRating} disabled={busy} />

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">
                Title <span className="font-normal text-muted">(optional)</span>
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                placeholder="Sum it up in a few words"
                className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">
                Your review
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                maxLength={2000}
                required
                placeholder="What do you like? What could be better?"
                className="w-full resize-y rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
              <span className="mt-1 block text-right text-[10px] text-muted">
                {body.length}/2000
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-[#E892A2]/15 px-3 py-2 text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]"
              >
                {error}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#DDF3E8] px-3 py-2 text-xs font-medium text-[#2f7a5c]"
              >
                <Check className="h-3.5 w-3.5" /> Thanks! Your review is live.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy} loadingLabel="Posting…">
                <MessageSquareQuote className="h-4 w-4" />
                {myReview ? "Save changes" : "Post review"}
              </Button>
              {myReview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                    setRating(myReview.rating);
                    setTitle(myReview.title ?? "");
                    setBody(myReview.body);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-ink">
          {summary.count ? "Recent reviews" : "No reviews yet"}
        </h2>

        {reviews.length === 0 ? (
          <Card className="border-dashed p-8 text-center">
            <MessageSquareQuote className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm font-bold text-ink">
              Be the first to share
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
              Once someone posts a review it will appear here for everyone to
              read.
            </p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/50 text-xs font-extrabold text-primary-deep dark:text-primary-soft">
                  {initials(review.display_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">
                      {review.display_name}
                    </p>
                    {review.user_id === userId && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-deep dark:text-primary-soft">
                        You
                      </span>
                    )}
                    <span className="text-[10px] text-muted">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <StarDisplay value={review.rating} className="mt-1" />
                  {review.title && (
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {review.title}
                    </p>
                  )}
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {review.body}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <p className="pt-2 text-center text-[11px] text-muted">
        Found a problem instead?{" "}
        <Link
          href="/report"
          className="font-semibold text-primary-deep hover:underline dark:text-primary-soft"
        >
          Report a bug
        </Link>
        .
      </p>
    </div>
  );
}
