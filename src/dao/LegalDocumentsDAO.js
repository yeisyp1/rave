import { supabase, unwrap } from "./SupabaseDAO";

export const getLatestLegalDocumentDAO = (docType) =>
  unwrap(
    supabase
      .from("legal_documents")
      .select("id, doc_type, version, title, content, published_at")
      .eq("doc_type", docType)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );

export const getDataControllerDAO = () =>
  unwrap(supabase.from("data_controller").select("*").eq("id", 1).maybeSingle());
