import api from './api';

const familyService = {
  getMembers: async () => {
    const res = await api.get('/family');
    return res.data;
  },

  createMember: async (data) => {
    const res = await api.post('/family', data);
    return res.data;
  },

  updateMember: async (id, data) => {
    const res = await api.put(`/family/${id}`, data);
    return res.data;
  },

  deleteMember: async (id) => {
    const res = await api.delete(`/family/${id}`);
    return res.data;
  },
};

export default familyService;
