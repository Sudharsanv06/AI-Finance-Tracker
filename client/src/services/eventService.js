import api from './api';

const eventService = {
  getEvents: async (status = '') => {
    const url = status ? `/events?status=${status}` : '/events';
    const res = await api.get(url);
    return res.data;
  },

  getEventById: async (id) => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },

  createEvent: async (data) => {
    const res = await api.post('/events', data);
    return res.data;
  },

  updateEvent: async (id, data) => {
    const res = await api.put(`/events/${id}`, data);
    return res.data;
  },

  deleteEvent: async (id) => {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  },
};

export default eventService;