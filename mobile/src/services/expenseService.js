import api from './api';

export const getExpenses = async (page = 1) => {
  const res = await api.get(`/expenses?page=${page}&limit=10`);
  return res.data;
};

export const createExpense = async (data) => {
  const res = await api.post('/expenses', data);
  return res.data;
};

export const approveExpense = async (id) => {
  const res = await api.put(`/expenses/${id}/approve`);
  return res.data;
};

export const rejectExpense = async (id, rejectionReason) => {
  const res = await api.put(`/expenses/${id}/reject`, { rejectionReason });
  return res.data;
};

export const deleteExpense = async (id) => {
  const res = await api.delete(`/expenses/${id}`);
  return res.data;
};