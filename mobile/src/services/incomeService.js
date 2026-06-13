import api from './api';

export const getIncome = async (page = 1) => {
  const res = await api.get(`/income?page=${page}&limit=10`);
  return res.data;
};

export const getSummary = async () => {
  const res = await api.get('/income/summary');
  return res.data;
};

export const createIncome = async (data) => {
  const res = await api.post('/income', data);
  return res.data;
};

export const deleteIncome = async (id) => {
  const res = await api.delete(`/income/${id}`);
  return res.data;
};

export const updateIncome = async (id, data) => {
  const res = await api.put(`/income/${id}`, data);
  return res.data;
};