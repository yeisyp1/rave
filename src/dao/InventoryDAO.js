import { supabase } from "./SupabaseDAO";

export const listInventoryItemsDAO = async () => {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createInventoryItemDAO = async (payload) => {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateInventoryItemStockDAO = async (id, stock) => {
  const { data, error } = await supabase
    .from("inventory_items")
    .update({ stock })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
