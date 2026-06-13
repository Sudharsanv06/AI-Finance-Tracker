import api from './api';

const investmentService = {
  getInvestments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res   = await api.get(`/investments${query ? `?${query}` : ''}`);
    return res.data;
  },

  getSummary: async () => {
    const res = await api.get('/investments/summary');
    return res.data;
  },

  createInvestment: async (data) => {
    const res = await api.post('/investments', data);
    return res.data;
  },

  updateInvestment: async (id, data) => {
    const res = await api.put(`/investments/${id}`, data);
    return res.data;
  },

  deleteInvestment: async (id) => {
    const res = await api.delete(`/investments/${id}`);
    return res.data;
  },
};

export default investmentService;
