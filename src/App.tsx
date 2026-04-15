import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Login from './pages/Login';
import AdminDashboard from './pages/Admin/AdminDashboard'; 
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard'; 
import CompanyDashboard from './pages/Admin/CompanyDashboard';

// 1. Instanciamos el QueryClient con configuraciones por defecto conservadoras
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // La caché se considera "fresca" por 5 minutos
      retry: 1, // Solo 1 reintento automático si la red falla
      refetchOnWindowFocus: false, // No recargar la API solo por cambiar de pestaña (opcional)
    },
  },
});

function App() {
  return (
    // 2. Envolvemos toda la App
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" reverseOrder={false} />
      
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/admin/empresa/:id" element={<CompanyDashboard />} />
        </Routes>
      </Router>
      
      {/* 3. Devtools (Aparecerá un ícono flotante solo en modo desarrollo) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;