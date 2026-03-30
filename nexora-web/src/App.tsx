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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
