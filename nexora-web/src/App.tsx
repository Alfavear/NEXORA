import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Returns from "./pages/Returns";
import Reports from "./pages/Reports";
import Kardex from "./pages/Kardex";
import Branches from "./pages/Branches";
import Roles from "./pages/Roles";
import Maintenance from "./pages/Maintenance";
import ItemGroups from "./pages/ItemGroups";
import ItemBrands from "./pages/ItemBrands";
import ItemOwners from "./pages/ItemOwners";
import Adjustments from "./pages/Adjustments";
import PaymentMethods from "./pages/PaymentMethods";
import Taxes from "./pages/Taxes";

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
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/adjustments" element={<Adjustments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/kardex" element={<Kardex />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/item-groups" element={<ItemGroups />} />
            <Route path="/item-brands" element={<ItemBrands />} />
            <Route path="/item-owners" element={<ItemOwners />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="/taxes" element={<Taxes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
