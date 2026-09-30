import { supabase } from './SupabaseDAO';

const FALLBACK_INVOICES = [
  { id: 1, patient: 'Juan Perez', date: '2025-02-10', amount: 150, status: 'Pagado' },
  { id: 2, patient: 'Maria Garcia', date: '2025-02-05', amount: 200, status: 'Pagado' },
  { id: 3, patient: 'Carlos Lopez', date: '2025-01-28', amount: 300, status: 'Pendiente' },
  { id: 4, patient: 'Ana Rodriguez', date: '2025-02-01', amount: 120, status: 'Pendiente' },
];

export const getBillingInvoicesDAO = async () => {
  try {
    const { data, error } = await supabase
      .from('billing_invoices')
      .select('*, payments(amount, anulado), invoice_items(*)')
      .order('date', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('getBillingInvoicesDAO supabase error:', error);
      return FALLBACK_INVOICES;
    }

    return data ?? [];
  } catch (err) {
    console.error('getBillingInvoicesDAO unexpected error:', err);
    return FALLBACK_INVOICES;
  }
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
