import type { Metadata } from "next";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { getOptionalUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/types";
import { ReviewsView } from "./ReviewsView";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "See what people think of LumiNest, and share your own rating once you have a nest.",
};
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  let signedIn = false;
  let userId: string | null = null;
  let myReview: Review | null = null;
  let reviews: Review[] = [];

  try {
    const { user } = await getOptionalUser();
    signedIn = Boolean(user);
    userId = user?.id ?? null;
  } catch {
    signedIn = false;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    reviews = (data as Review[] | null) ?? [];
    myReview = userId
      ? reviews.find((review) => review.user_id === userId) ?? null
      : null;
  } catch {
    reviews = [];
  }

  return (
    <div className="relative min-h-dvh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-28 top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 top-64 h-72 w-72 rounded-full bg-softBlue/40 blur-3xl" />
      </div>

      <PublicHeader signedIn={signedIn} />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            Little words, big help
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            What people say about LumiNest
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Real reviews from people with a nest. Anyone can read them — only
            signed-in members can post.
          </p>
        </div>

        <ReviewsView
          signedIn={signedIn}
          userId={userId}
          reviews={reviews}
          myReview={myReview}
        />
      </main>
    </div>
  );
}
