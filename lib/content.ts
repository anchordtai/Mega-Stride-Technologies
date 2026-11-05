import "server-only";
import { userDatabase } from "./supabase/server";
import { databaseReady } from "./supabase/config";
export type PublishedItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  category: string | null;
  updated_at: string;
};
export async function publishedContent(
  kind: string,
): Promise<{ items: PublishedItem[]; unavailable: boolean }> {
  if (!databaseReady()) return { items: [], unavailable: false };
  const db = await userDatabase();
  const { data, error } = await db
    .from("content")
    .select("id,slug,title,summary,body,category,updated_at")
    .eq("kind", kind)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(100);
  return { items: data || [], unavailable: !!error };
}
