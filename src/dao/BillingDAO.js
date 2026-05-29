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
      .select('*')
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

export const createBillingInvoiceDAO = async (payload) => {
  const { data, error } = await supabase.from('billing_invoices').insert([payload]).select('*').single();
  if (error) throw error;
  return data;
};

export const updateBillingInvoiceDAO = async (id, payload) => {
  const { data, error } = await supabase.from('billing_invoices').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
};

export const deleteBillingInvoiceDAO = async (id) => {
  const { error } = await supabase.from('billing_invoices').delete().eq('id', id);
  if (error) throw error;
};
