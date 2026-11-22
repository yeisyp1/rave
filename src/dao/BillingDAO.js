import { supabase, unwrap } from './SupabaseDAO';

// Si la consulta falla se propaga el error: nunca se devuelven facturas de relleno.
export const getBillingInvoicesDAO = async () =>
  (await unwrap(
    supabase
      .from('billing_invoices')
      .select('*, payments(amount, anulado, paid_at), invoice_items(*)')
      .order('date', { ascending: false })
      .limit(1000)
  )) ?? [];

// Crea la factura y sus items en una sola transaccion (funcion create_invoice_with_items).
export const createInvoiceWithItemsDAO = (invoice, items) =>
  unwrap(supabase.rpc('create_invoice_with_items', { p_invoice: invoice, p_items: items }));

export const updateBillingInvoiceDAO = (id, payload) =>
  unwrap(supabase.from('billing_invoices').update(payload).eq('id', id).select('*').single());

// Las facturas no se borran: se anulan con motivo (la base de datos no tiene politica de DELETE).
export const annulBillingInvoiceDAO = (id, motivo) =>
  unwrap(
    supabase
      .from('billing_invoices')
      .update({ status: 'Anulado', motivo_anulacion: motivo })
      .eq('id', id)
      .select('*')
      .single()
  );

export const listPaymentsByInvoiceDAO = async (invoiceId) =>
  (await unwrap(
    supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })
  )) ?? [];

export const createPaymentDAO = (payload) =>
  unwrap(supabase.from('payments').insert([payload]).select('*').single());

export const annulPaymentDAO = (id, motivo) =>
  unwrap(
    supabase
      .from('payments')
      .update({ anulado: true, motivo_anulacion: motivo })
      .eq('id', id)
      .select('*')
      .single()
  );
