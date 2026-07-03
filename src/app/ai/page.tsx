import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAiProvider } from "@/lib/ai/client";
import { recommendFromLibrary, cleanReview } from "@/app/ai/actions";
import { AiToolCard } from "@/components/ai/AiToolCard";
import { SpoilerFreeSummaryTool } from "@/components/ai/SpoilerFreeSummaryTool";

export default async function AiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("saved_items")
    .select("id, title")
    .eq("user_id", user.id)
    .order("title", { ascending: true });

  const isConfigured = getAiProvider() !== null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 text-center">
        <span className="text-4xl">✨</span>
        <h1 className="mt-4 font-display text-3xl text-foreground sm:text-4xl">
          ScreenDiary <span className="text-gradient">AI</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Four small AI tools that read from your own diary — nothing more.
        </p>
      </div>

      {!isConfigured && (
        <div className="glass-card mb-8 rounded-2xl px-5 py-4 text-center text-sm text-amber-300">
          AI is not configured yet. Add ANTHROPIC_API_KEY to your .env.local file.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AiToolCard
          icon="🤖"
          title="Recommendation Helper"
          description="Describe what you want, and I'll pick from your diary — or tell you what to search for if nothing fits."
          placeholder={`Try: "I want something romantic but not too sad" or "I feel bored and want a short movie"`}
          submitLabel="Get a recommendation"
          action={recommendFromLibrary}
        />

        <AiToolCard
          icon="💭"
          title="Mood Matcher"
          description="Tell me how you feel, and I'll match it against your mood tags, ratings, and notes."
          placeholder={`Try: "I'm sad but I don't want to cry more" or "I'm in the mood for chaos"`}
          submitLabel="Match my mood"
          action={recommendFromLibrary}
        />

        <AiToolCard
          icon="🧹"
          title="Review Cleaner"
          description="Paste your messy thoughts and get a polished (and a shorter) version — same tone, no invented details."
          placeholder={`Try: "it was cute but kinda slow and the ending annoyed me"`}
          submitLabel="Clean it up"
          action={cleanReview}
        />

        <SpoilerFreeSummaryTool items={items ?? []} />
      </div>
    </div>
  );
}
