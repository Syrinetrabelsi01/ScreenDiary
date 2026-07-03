// Hand-written types for the tables used in Phase 1.
// If you regenerate this later with the Supabase CLI (`supabase gen types typescript`),
// this file can be replaced with the generated version.

export type MediaType = "movie" | "tv";

export type SavedItemStatus =
  | "want_to_watch"
  | "watching"
  | "completed"
  | "dropped"
  | "rewatching"
  | "favorite";

export type SavedItemRow = {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  overview: string | null;
  release_date: string | null;
  genres: string[];
  tmdb_rating: number | null;
  status: SavedItemStatus;
  personal_rating: number | null;
  emoji_reaction: string | null;
  personal_notes: string | null;
  current_season: number | null;
  current_episode: number | null;
  total_seasons: number | null;
  total_episodes: number | null;
  runtime_minutes: number | null;
  season_episode_counts: Record<string, number> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type MoodTagRow = {
  id: number;
  name: string;
}

export type ItemMoodTagRow = {
  id: string;
  saved_item_id: string;
  mood_tag_id: number;
  created_at: string;
}

// Shape returned by `.select("saved_item_id, mood_tags(name)")` style embedded
// queries. Cast raw query results to this instead of relying on Supabase's
// generic inference, since our hand-written Database type has no
// relationship metadata for it to resolve embedded selects automatically.
export type MoodTagLinkRow = {
  saved_item_id: string;
  mood_tags: { name: string } | null;
}

export type SharedListRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_at: string;
}

export type SharedListItemRow = {
  id: string;
  shared_list_id: string;
  saved_item_id: string | null;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  overview: string | null;
  added_by: string;
  created_at: string;
}

export type VoteType = "want_to_watch" | "maybe" | "not_interested";

export type SharedListVoteRow = {
  id: string;
  shared_list_item_id: string;
  voter_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; created_at: string };
        Insert: { id: string; email?: string | null };
        Update: { email?: string | null };
        Relationships: [];
      };
      saved_items: {
        Row: SavedItemRow;
        Insert: Partial<SavedItemRow> &
          Pick<SavedItemRow, "user_id" | "tmdb_id" | "media_type" | "title">;
        Update: Partial<SavedItemRow>;
        Relationships: [];
      };
      mood_tags: {
        Row: MoodTagRow;
        Insert: { name: string };
        Update: { name?: string };
        Relationships: [];
      };
      item_mood_tags: {
        Row: ItemMoodTagRow;
        Insert: { saved_item_id: string; mood_tag_id: number };
        Update: { saved_item_id?: string; mood_tag_id?: number };
        Relationships: [];
      };
      shared_lists: {
        Row: SharedListRow;
        Insert: Partial<SharedListRow> & Pick<SharedListRow, "owner_id" | "name" | "invite_code">;
        Update: Partial<SharedListRow>;
        Relationships: [];
      };
      shared_list_items: {
        Row: SharedListItemRow;
        Insert: Partial<SharedListItemRow> &
          Pick<SharedListItemRow, "shared_list_id" | "tmdb_id" | "media_type" | "title" | "added_by">;
        Update: Partial<SharedListItemRow>;
        Relationships: [];
      };
      shared_list_votes: {
        Row: SharedListVoteRow;
        Insert: Partial<SharedListVoteRow> &
          Pick<SharedListVoteRow, "shared_list_item_id" | "voter_id" | "vote_type">;
        Update: Partial<SharedListVoteRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
