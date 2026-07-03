"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VoteType } from "@/lib/supabase/database.types";

// Avoids visually ambiguous characters (0/O, 1/I) since this code gets typed
// or read aloud when sharing a list with someone.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export type CreateSharedListResult = { status: "error"; message: string } | void;

export async function createSharedList(
  name: string,
  description: string
): Promise<CreateSharedListResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "You must be logged in." };

  if (!name.trim()) return { status: "error", message: "Give your list a name." };

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const { data, error } = await supabase
      .from("shared_lists")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        invite_code: code,
      })
      .select("invite_code")
      .single();

    if (!error && data) {
      revalidatePath("/shared");
      redirect(`/shared/${data.invite_code}`);
    }
    if (error && error.code !== "23505") {
      console.error("createSharedList failed:", error);
      return { status: "error", message: "Couldn't create the list. Please try again." };
    }
    // 23505 = unique_violation on invite_code — retry with a freshly generated code.
  }

  return { status: "error", message: "Couldn't generate a unique invite code. Please try again." };
}

export async function addItemToSharedList(listId: string, savedItemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: list } = await supabase
    .from("shared_lists")
    .select("id, owner_id, invite_code")
    .eq("id", listId)
    .single();

  if (!list || list.owner_id !== user.id) return;

  const { data: savedItem } = await supabase
    .from("saved_items")
    .select("tmdb_id, media_type, title, poster_path, overview")
    .eq("id", savedItemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!savedItem) return;

  await supabase.from("shared_list_items").insert({
    shared_list_id: listId,
    saved_item_id: savedItemId,
    tmdb_id: savedItem.tmdb_id,
    media_type: savedItem.media_type,
    title: savedItem.title,
    poster_path: savedItem.poster_path,
    overview: savedItem.overview,
    added_by: user.id,
  });

  revalidatePath(`/shared/${list.invite_code}`);
}

export async function removeItemFromSharedList(itemId: string, listCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS scopes this delete to lists the caller owns; a non-owner's call is a no-op.
  await supabase.from("shared_list_items").delete().eq("id", itemId);
  revalidatePath(`/shared/${listCode}`);
}

export async function deleteSharedList(listId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("shared_lists").delete().eq("id", listId).eq("owner_id", user.id);
  revalidatePath("/shared");
  redirect("/shared");
}

export async function castVote(itemId: string, listCode: string, voteType: VoteType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("shared_list_votes").upsert(
    {
      shared_list_item_id: itemId,
      voter_id: user.id,
      vote_type: voteType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "shared_list_item_id,voter_id" }
  );

  revalidatePath(`/shared/${listCode}`);
}
