import { useEffect, useState } from "react";
import { listUsers } from "../api/users";
import { useAuth } from "../auth/AuthContext";
import Shell from "../components/Shell";

type UserRow = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: { name: string };
  userBranches: {
    branchId: number;
    isActive: boolean;
    branch: { name: string };
  }[];
};

export default function Users() {
  const { me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (me?.role === "ADMIN") {
      listUsers().then((data) => {
        setUsers(data);
        setLoading(false);
      });
    }
  }, [me]);

  // 🔒 Protección frontend
  if (!me) return <div className="p-6">Cargando...</div>;

  if (me.role !== "ADMIN") {
    return (
      <Shell>
        <div className="card p-6 text-center">
          <h2 className="text-lg font-semibold text-rose-600">
            Acceso restringido
          </h2>
          <p className="text-slate-600 mt-2">
            Solo los administradores pueden gestionar usuarios.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Usuarios</h1>
            <p className="text-sm text-slate-500">
              Gestión de usuarios multi-sede
            </p>
          </div>

          <button className="btn-primary">
            + Crear usuario
          </button>
        </div>

        {loading ? (
          <div className="mt-6 text-slate-500">Cargando usuarios...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-indigo-50 text-indigo-900 text-sm">
                  <th className="text-left px-4 py-3 rounded-l-xl">ID</th>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Sedes</th>
                  <th className="text-left px-4 py-3 rounded-r-xl">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition"
                  >
                    <td className="px-4 py-3 font-medium">{u.id}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="pill-indigo">
                        {u.role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.userBranches.map((b) => (
                          <span
                            key={b.branchId}
                            className="pill bg-indigo-100 text-indigo-800"
                          >
                            {b.branch.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="pill-emerald">Activo</span>
                      ) : (
                        <span className="pill bg-rose-100 text-rose-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
