import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Shell() {
  const { me, logout, switchBranch } = useAuth();
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-bold">Nexora</div>
          <button onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-3">
          <nav>
            <NavLink to="/" active={loc.pathname === "/"}>Dashboard</NavLink>
            <NavLink to="/sales" active={loc.pathname.startsWith("/sales")}>Ventas</NavLink>
            <NavLink to="/returns" active={loc.pathname.startsWith("/returns")}>Devoluciones</NavLink>
            <NavLink to="/customers" active={loc.pathname.startsWith("/customers")}>Clientes</NavLink>
            <NavLink to="/kardex" active={loc.pathname.startsWith("/kardex")}>Kardex</NavLink>
          </nav>
        </aside>
        <main className="col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, active, children }: any) {
  return <Link to={to} style={{ fontWeight: active ? 'bold' : 'normal', display: 'block' }}>{children}</Link>;
}
