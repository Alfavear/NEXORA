import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/sales", label: "Ventas" },
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
];

export default function Shell() {
  const { me, logout, switchBranch } = useAuth();
  const loc = useLocation();

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top_left,#0b1220_0%,#040913_50%,#02030a_100%)] text-slate-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-r border-slate-800 p-5 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-wide text-white">Nexora</h1>
          <p className="text-xs uppercase text-indigo-200 tracking-wider">Sistema comercial</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = loc.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
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
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/70 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-inner">
          <div className="text-sm text-slate-200">
            Bienvenido, <span className="font-semibold text-white">{me?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">Sede:</span>
            <select
              className="input input-sm bg-slate-900 text-white border-slate-700"
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
              className="btn btn-danger py-2 px-4"
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