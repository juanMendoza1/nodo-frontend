import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/AdminDashboard'; // Para usuarios normales
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard'; // <-- NUEVO
import CompanyDashboard from './pages/Admin/CompanyDashboard';

function App() {
  return (
    // 🔥 Envolvemos todo en un Fragmento vacío <> </>
    <>
      <Toaster position="top-right" reverseOrder={false} />
      
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          {/* Ruta para selección de negocios (Admin Normal) */}
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Ruta para la vista Maestra (Super Admin) */}
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          {/* Ruta dinámica para la gestión interna de una empresa */}
          <Route path="/admin/empresa/:id" element={<CompanyDashboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;