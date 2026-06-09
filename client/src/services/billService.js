import api from './api';

const billService = {
  getBills: async () => {
    const res = await api.get('/bills');
    return res.data;
  },
  createBill: async (data) => {
    const res = await api.post('/bills', data);
    return res.data;
  },
  markPaid: async (id) => {
    const res = await api.patch(`/bills/${id}/pay`);
    return res.data;
  },
  markUnpaid: async (id) => {
    const res = await api.patch(`/bills/${id}/unpay`);
    return res.data;
  },
  updateBill: async (id, data) => {
    const res = await api.put(`/bills/${id}`, data);
    return res.data;
  },
  deleteBill: async (id) => {
    const res = await api.delete(`/bills/${id}`);
    return res.data;
  },
};

export default billService;