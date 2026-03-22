import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PhyloidGenome } from "../engine/types.js";

export interface GalleryEntry {
  id: string;
  genome: PhyloidGenome;
  author: string;
  prompt: string;
  likes: number;
  created_at: string;
}

export interface GalleryFilter {
  orderBy?: "likes" | "created_at";
  limit?: number;
  offset?: number;
}

const TABLE = "phyloid_gallery";

export class SupabaseGallery {
  private client: SupabaseClient;

  constructor(url?: string, anonKey?: string) {
    const supabaseUrl = url ?? import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Supabase credentials required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async save(entry: Omit<GalleryEntry, "id" | "likes" | "created_at">): Promise<GalleryEntry> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({ genome: entry.genome, author: entry.author, prompt: entry.prompt })
      .select()
      .single();

    if (error) throw new Error(`Gallery save failed: ${error.message}`);
    return data as GalleryEntry;
  }

  async list(filter: GalleryFilter = {}): Promise<GalleryEntry[]> {
    const { orderBy = "created_at", limit = 20, offset = 0 } = filter;

    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .order(orderBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Gallery list failed: ${error.message}`);
    return (data ?? []) as GalleryEntry[];
  }

  async like(id: string): Promise<void> {
    const { error } = await this.client.rpc("increment_likes", { entry_id: id });
    if (error) throw new Error(`Like failed: ${error.message}`);
  }

  async getById(id: string): Promise<GalleryEntry | null> {
    const { data, error } = await this.client.from(TABLE).select("*").eq("id", id).single();
    if (error) return null;
    return data as GalleryEntry;
  }
}

/**
 * SQL to create the gallery table in Supabase:
 *
 * CREATE TABLE phyloid_gallery (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   genome JSONB NOT NULL,
 *   author TEXT NOT NULL DEFAULT 'anonymous',
 *   prompt TEXT NOT NULL DEFAULT '',
 *   likes INTEGER NOT NULL DEFAULT 0,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * CREATE OR REPLACE FUNCTION increment_likes(entry_id UUID)
 * RETURNS void AS $$
 *   UPDATE phyloid_gallery SET likes = likes + 1 WHERE id = entry_id;
 * $$ LANGUAGE sql;
 */
