import api from './api';

const incomeService = {
  getIncome: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res   = await api.get(`/income${query ? `?${query}` : ''}`);
    return res.data;
  },

  getSummary: async () => {
    const res = await api.get('/income/summary');
    return res.data;
  },

  createIncome: async (data) => {
    const res = await api.post('/income', data);
    return res.data;
  },

  updateIncome: async (id, data) => {
    const res = await api.put(`/income/${id}`, data);
    return res.data;
  },

  deleteIncome: async (id) => {
    const res = await api.delete(`/income/${id}`);
    return res.data;
  },
};

export default incomeService;