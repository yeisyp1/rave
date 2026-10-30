import { supabase } from './SupabaseDAO';

// Si la consulta falla se propaga el error: nunca se devuelven facturas de relleno.
export const getBillingInvoicesDAO = async () => {
  const { data, error } = await supabase
    .from('billing_invoices')
    .select('*, payments(amount, anulado, paid_at), invoice_items(*)')
    .order('date', { ascending: false })
    .limit(1000);

  if (error) throw error;
  return data ?? [];
};

// Crea la factura y sus items en una sola transaccion (funcion create_invoice_with_items).
export const createInvoiceWithItemsDAO = async (invoice, items) => {
  const { data, error } = await supabase.rpc('create_invoice_with_items', { p_invoice: invoice, p_items: items });
  if (error) throw error;
  return data;
};

export const updateBillingInvoiceDAO = async (id, payload) => {
  const { data, error } = await supabase.from('billing_invoices').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
};

// Las facturas no se borran: se anulan con motivo (la base de datos no tiene politica de DELETE).
export const annulBillingInvoiceDAO = async (id, motivo) => {
  const { data, error } = await supabase
    .from('billing_invoices')
    .update({ status: 'Anulado', motivo_anulacion: motivo })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const listPaymentsByInvoiceDAO = async (invoiceId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const createPaymentDAO = async (payload) => {
  const { data, error } = await supabase.from('payments').insert([payload]).select('*').single();
  if (error) throw error;
  return data;
};

export const annulPaymentDAO = async (id, motivo) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ anulado: true, motivo_anulacion: motivo })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};
