import api from './api';

export const getLoans    = async () => { const res = await api.get('/loans');           return res.data; };
export const getSummary  = async () => { const res = await api.get('/loans/summary');   return res.data; };
export const createLoan  = async (d) => { const res = await api.post('/loans', d);      return res.data; };
export const addPayment  = async (id, d) => { const res = await api.post(`/loans/${id}/payment`, d); return res.data; };
export const deleteLoan  = async (id) => { const res = await api.delete(`/loans/${id}`); return res.data; };