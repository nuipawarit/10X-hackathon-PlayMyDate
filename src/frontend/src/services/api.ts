import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (email: string, password: string, display_name?: string) =>
  api.post('/auth/register', { email, password, display_name });

// User
export const getProfile = () => api.get('/users/me');

export const updateProfile = (data: {
  display_name?: string;
  playing_style?: string[];
  interests?: string[];
  bio?: string;
}) => api.put('/users/me/profile', data);

export const updatePrivateData = (data: {
  real_name?: string;
  photo_url?: string;
  occupation?: string;
}) => api.put('/users/me/private-data', data);

// Matches
export const getMatches = () => api.get('/matches/me');
export const findMatches = () => api.post('/matches/find');
export const getMatch = (matchId: string) => api.get(`/matches/${matchId}`);
export const unmatch = (matchId: string) => api.post(`/matches/${matchId}/unmatch`);

// Activities
export const getAvailableActivities = (matchId: string) =>
  api.get(`/activities/match/${matchId}`);
export const getActivityInstances = (matchId: string) =>
  api.get(`/activities/match/${matchId}/instances`);
export const startActivity = (matchId: string, activityId: string) =>
  api.post(`/activities/match/${matchId}/start/${activityId}`);
export const completeActivity = (instanceId: string, result: Record<string, any>) =>
  api.post(`/activities/instance/${instanceId}/complete`, { result });

// Intimacy
export const getIntimacy = (matchId: string) => api.get(`/intimacy/match/${matchId}`);
export const getUnlocks = (matchId: string) => api.get(`/intimacy/match/${matchId}/unlocks`);
export const unlock = (matchId: string, unlockType: string) =>
  api.post(`/intimacy/match/${matchId}/unlock/${unlockType}`);

// Messages
export const getMessages = (matchId: string, limit?: number, offset?: number) =>
  api.get(`/messages/match/${matchId}`, { params: { limit, offset } });
export const sendMessage = (matchId: string, content: string) =>
  api.post(`/messages/match/${matchId}`, { content });

export default api;
