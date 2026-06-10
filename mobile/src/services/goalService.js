import api from './api';

export const getGoals        = async () => { const res = await api.get('/goals');               return res.data; };
export const createGoal      = async (d) => { const res = await api.post('/goals', d);           return res.data; };
export const addContribution = async (id, amount) => {
  const res = await api.post(`/goals/${id}/contribute`, { amount });
  return res.data;
};
export const deleteGoal = async (id) => { const res = await api.delete(`/goals/${id}`); return res.data; };