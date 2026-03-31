import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Returns from "./pages/Returns";
import Reports from "./pages/Reports";
import Kardex from "./pages/Kardex";
import Branches from "./pages/Branches";
import Roles from "./pages/Roles";
import Maintenance from "./pages/Maintenance";

function RequireAuth() {
  const { token, loading } = useAuth();
  if (loading) return <div className="p-6">Cargando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <Shell />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/kardex" element={<Kardex />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/maintenance" element={<Maintenance />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
