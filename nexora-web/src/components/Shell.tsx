import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Shell() {
  const { me, logout, switchBranch } = useAuth();
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-indigo-200/60 border border-indigo-200 flex items-center justify-center font-bold text-slate-800">
              N
            </div>
            <div>
              <div className="font-semibold leading-5">Nexora</div>
              <div className="text-xs text-slate-500">Inventarios multi-sede</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {me && (
              <>
                <span className="hidden sm:inline pill-indigo">{me.role}</span>

                <select
                  className="input w-auto bg-white"
                  value={me.branchId}
                  onChange={(e) => switchBranch(Number(e.target.value))}
                >
                  {me.branches.map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <button className="btn-soft" onClick={logout}>
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="card p-3">
            <NavLink to="/" active={loc.pathname === "/"}>Dashboard</NavLink>
            <NavLink to="/users" active={loc.pathname.startsWith("/users")}>Usuarios</NavLink>

            <div className="my-2 border-t border-slate-200"></div>
            <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">
              Catalogo
            </div>

            <NavLink to="/suppliers" active={loc.pathname.startsWith("/suppliers")}>Proveedores</NavLink>
            <NavLink to="/customers" active={loc.pathname.startsWith("/customers")}>Clientes</NavLink>
          </nav>

          {me && (
            <div className="mt-4 card p-4">
              <div className="text-sm font-semibold">{me.name}</div>
              <div className="text-xs text-slate-600">{me.email}</div>
              <div className="mt-3 text-xs text-slate-500">
                Sede activa:{" "}
                <span className="font-medium text-slate-700">
                  {me.branchName ?? "-"}
                </span>
              </div>
            </div>
          )}
        </aside>

        <main className="col-span-12 md:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={[
        "block rounded-xl px-3 py-2 text-sm font-medium transition",
        active ? "bg-indigo-100 text-indigo-900" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
