import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/sales", label: "Facturación y Cartera" },
  { to: "/purchases", label: "Compras (Almacén)" },
  { to: "/returns", label: "Devoluciones" },
  { to: "/adjustments", label: "Ajustes" },
  { to: "/reports", label: "Reportes" },
  { to: "/kardex", label: "Kardex" },
  { to: "/maintenance", label: "Mantenimiento" },
];

const masterItems = [
  { to: "/users", label: "Usuarios" },
  { to: "/suppliers", label: "Proveedores" },
  { to: "/customers", label: "Clientes" },
  { to: "/roles", label: "Roles" },
  { to: "/branches", label: "Sucursales" },
  { to: "/item-groups", label: "Grupos" },
  { to: "/item-brands", label: "Marcas" },
  { to: "/item-owners", label: "Propietarios" },
  { to: "/payment-methods", label: "Métodos de Pago" },
  { to: "/taxes", label: "Impuestos" },
];

export default function Shell() {
  const { me, logout, switchBranch } = useAuth();
  const loc = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-[100dvh] flex bg-[radial-gradient(circle_at_top_left,#0b1220_0%,#040913_50%,#02030a_100%)] text-slate-100 overflow-x-hidden">

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={closeMenu} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-r border-slate-800 p-5 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold tracking-wide text-white">Nexora</h1>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={closeMenu}><X className="w-6 h-6" /></button>
        </div>
        <p className="text-xs uppercase text-indigo-200 tracking-wider mb-6 -mt-4">Sistema comercial</p>

        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-100px)] pb-10 custom-scrollbar pr-2">
          {navItems.map((item) => {
            const active = loc.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={`block px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-indigo-500/25 text-white ring-1 ring-indigo-300 shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="mt-4 pt-4 border-t border-slate-800 text-xs uppercase tracking-widest text-slate-400">Maestros</div>
          {masterItems.map((item) => {
            const active = loc.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/20 text-white ring-1 ring-indigo-300'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="lg:hidden p-2 -ml-2 text-slate-300 hover:text-white bg-slate-800/50 rounded-xl transition-all active:scale-90" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-sm text-slate-200 hidden xs:block truncate">
              Hola, <span className="font-semibold text-white">{me?.name?.split(' ')[0]}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <select
              className="input py-1.5 px-2 bg-slate-900 text-white border-slate-700 text-[11px] sm:text-sm max-w-[100px] sm:max-w-none rounded-lg"
              value={me?.branchId ?? ''}
              onChange={async (e) => {
                const bid = Number(e.target.value);
                if (!isNaN(bid) && bid > 0) {
                  await switchBranch(bid);
                }
              }}
            >
              {me?.branches?.map((b) => (
                <option key={b.branchId} value={b.branchId}>{b.name}</option>
              ))}
            </select>
            <button
              onClick={logout}
              className="btn-danger py-1.5 sm:py-2 px-3 sm:px-4 text-[11px] sm:text-sm font-bold active:scale-95 transition-all"
            >
              Salir
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}