export const getBillingInvoicesDAO = () => {
  return [
    {
      id: 1,
      patient: "Juan Perez",
      date: "2025-02-10",
      amount: 150,
      status: "Pagado",
    },
    {
      id: 2,
      patient: "Maria Garcia",
      date: "2025-02-05",
      amount: 200,
      status: "Pagado",
    },
    {
      id: 3,
      patient: "Carlos Lopez",
      date: "2025-01-28",
      amount: 300,
      status: "Pendiente",
    },
    {
      id: 4,
      patient: "Ana Rodriguez",
      date: "2025-02-01",
      amount: 120,
      status: "Pendiente",
    },
  ];
};
