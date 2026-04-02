import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CompanyDashboard from './pages/Admin/CompanyDashboard'; // <-- Importamos el nuevo componente

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Agregamos la ruta dinámica para la empresa */}
        <Route path="/admin/empresa/:id" element={<CompanyDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;