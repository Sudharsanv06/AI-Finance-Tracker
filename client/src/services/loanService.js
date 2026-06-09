import api from './api';

const loanService = {
  getLoans: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res   = await api.get(`/loans${query ? `?${query}` : ''}`);
    return res.data;
  },

  getSummary: async () => {
    const res = await api.get('/loans/summary');
    return res.data;
  },

  createLoan: async (data) => {
    const res = await api.post('/loans', data);
    return res.data;
  },

  updateLoan: async (id, data) => {
    const res = await api.put(`/loans/${id}`, data);
    return res.data;
  },

  addPayment: async (id, data) => {
    const res = await api.post(`/loans/${id}/payment`, data);
    return res.data;
  },

  deleteLoan: async (id) => {
    const res = await api.delete(`/loans/${id}`);
    return res.data;
  },

  // Frontend EMI calculator
  calculateEMI: (principal, ratePercent, tenureMonths) => {
    if (!ratePercent) return Math.round(principal / tenureMonths);
    const r   = ratePercent / 12 / 100;
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) /
                (Math.pow(1 + r, tenureMonths) - 1);
    return Math.round(emi);
  },
};

export default loanService;