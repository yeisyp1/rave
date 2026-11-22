import { supabase, unwrap } from "./SupabaseDAO";

export const listInventoryItemsDAO = async () =>
  (await unwrap(
    supabase.from("inventory_items").select("*").order("created_at", { ascending: false })
  )) ?? [];

export const createInventoryItemDAO = (payload) =>
  unwrap(supabase.from("inventory_items").insert([payload]).select("*").single());

export const updateInventoryItemStockDAO = (id, stock) =>
  unwrap(supabase.from("inventory_items").update({ stock }).eq("id", id).select("*").single());

export const updateInventoryItemDAO = (id, payload) =>
  unwrap(supabase.from("inventory_items").update(payload).eq("id", id).select("*").single());

export const deleteInventoryItemDAO = (id) =>
  unwrap(supabase.from("inventory_items").delete().eq("id", id));
