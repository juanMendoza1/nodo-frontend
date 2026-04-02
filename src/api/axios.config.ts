import axios from 'axios';

const API_URL = 'http://localhost:8080'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Antes de que salga la petición, le pegamos el Token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // 💡 LA MAGIA ESTÁ AQUÍ: 
    // Solo agregamos el token si existe Y la ruta NO es la de login
    if (token && !config.url.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;