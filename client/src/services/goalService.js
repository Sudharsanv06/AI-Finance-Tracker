import api from './api';

const goalService = {
  getGoals: async (status = '') => {
    const url = status ? `/goals?status=${status}` : '/goals';
    const res = await api.get(url);
    return res.data;
  },
  createGoal: async (data) => {
    const res = await api.post('/goals', data);
    return res.data;
  },
  updateGoal: async (id, data) => {
    const res = await api.put(`/goals/${id}`, data);
    return res.data;
  },
  addContribution: async (id, amount) => {
    const res = await api.post(`/goals/${id}/contribute`, { amount });
    return res.data;
  },
  deleteGoal: async (id) => {
    const res = await api.delete(`/goals/${id}`);
    return res.data;
  },
};

export default goalService;