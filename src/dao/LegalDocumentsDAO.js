import { supabase } from "./SupabaseDAO";

export const getLatestLegalDocumentDAO = async (docType) => {
  const { data, error } = await supabase
    .from("legal_documents")
    .select("id, doc_type, version, title, content, published_at")
    .eq("doc_type", docType)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getDataControllerDAO = async () => {
  const { data, error } = await supabase
    .from("data_controller")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  return data;
};
