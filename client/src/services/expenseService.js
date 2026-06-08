import api from './api';

const expenseService = {
  getExpenses: async (eventId = '') => {
    const url = eventId ? `/expenses?eventId=${eventId}` : '/expenses';
    const res = await api.get(url);
    return res.data;
  },

  createExpense: async (data) => {
    const res = await api.post('/expenses', data);
    return res.data;
  },

  approveExpense: async (id) => {
    const res = await api.put(`/expenses/${id}/approve`);
    return res.data;
  },

  rejectExpense: async (id, rejectionReason) => {
    const res = await api.put(`/expenses/${id}/reject`, { rejectionReason });
    return res.data;
  },

  markAsPaid: async (id) => {
    const res = await api.put(`/expenses/${id}/pay`);
    return res.data;
  },

  deleteExpense: async (id) => {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },
};

export default expenseService;