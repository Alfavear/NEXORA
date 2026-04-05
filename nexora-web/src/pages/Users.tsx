import { useEffect, useState } from "react";
import { listUsers, createUser } from "../api/users";
import { useAuth } from "../auth/AuthContext";
import { branchesApi } from "../api/branches";
import type { Branch } from "../api/branches";
import { rolesApi } from "../api/roles";
import type { Role } from "../api/roles";

type UserRow = {
  id: number;
  name: string;
  email: string;
  username: string;
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
  
  // Estados para el Modal de Creación
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  
  // Campos del Formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    roleId: 0,
    branchIds: [] as number[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, branchesData, rolesData] = await Promise.all([
        listUsers(),
        branchesApi.list().then(res => res.data),
        rolesApi.list().then(res => res.data)
      ]);
      setUsers(usersData);
      setAvailableBranches(branchesData);
      setAvailableRoles(rolesData);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me?.role === "ADMIN") {
      fetchData();
    }
  }, [me]);

  const handleOpenModal = () => {
    setFormData({ 
      name: "", 
      email: "", 
      username: "",
      password: "", 
      roleId: availableRoles[0]?.id || 0,
      branchIds: [] 
    });
    setError("");
    setShowModal(true);
  };

  const toggleBranch = (id: number) => {
    setFormData(prev => ({
      ...prev,
      branchIds: prev.branchIds.includes(id)
        ? prev.branchIds.filter(bid => bid !== id)
        : [...prev.branchIds, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roleId === 0) {
      setError("Debes seleccionar un rol");
      return;
    }
    if (formData.branchIds.length === 0) {
      setError("Debes seleccionar al menos una sede");
      return;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await createUser(formData);
      setShowModal(false);
      await fetchData(); // recargar lista
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al crear el usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!me) return <div className="p-6">Cargando...</div>;

  if (me.role !== "ADMIN") {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-600">Acceso restringido</h2>
        <p className="text-slate-600 mt-2">
          Solo los administradores pueden gestionar usuarios.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Usuarios</h1>
            <p className="text-sm text-slate-300">Gestión de usuarios multi-sede</p>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleOpenModal}
          >
            + Crear usuario
          </button>
        </div>

        {loading ? (
          <div className="mt-6 text-slate-500">Cargando usuarios...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-800 text-slate-200 text-sm">
                  <th className="px-4 py-3 rounded-l-xl">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Sedes</th>
                  <th className="px-4 py-3 rounded-r-xl">Estado</th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 font-medium">{u.id}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="pill-indigo">{u.role.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.userBranches.map((b) => (
                          <span
                            key={b.branchId}
                            className="pill bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
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
                        <span className="pill bg-rose-500/10 text-rose-400 border border-rose-500/20">Inactivo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN - NEXORA POP-OUT STYLE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-950 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] border border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white">Nuevo Usuario</h2>
              <p className="text-xs text-slate-400 mt-1">Define las credenciales y accesos del nuevo miembro.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="input w-full bg-slate-900 border-slate-700 text-white"
                    placeholder="Ej: Juan Pérez"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Username (Opcional)</label>
                  <input
                    type="text"
                    className="input w-full bg-slate-900 border-slate-700 text-white"
                    placeholder="juan.perez"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Email Corporativo</label>
                  <input
                    type="email"
                    required
                    className="input w-full bg-slate-900 border-slate-700 text-white"
                    placeholder="juan@nexora.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Rol de Usuario</label>
                  <select
                    required
                    className="input w-full bg-slate-900 border-slate-700 text-white"
                    value={formData.roleId}
                    onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })}
                  >
                    <option value={0} disabled>Seleccionar Rol</option>
                    {availableRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Contraseña Temporal</label>
                <input
                  type="password"
                  required
                  className="input w-full bg-slate-900 border-slate-700 text-white"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Asignar Sedes</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-900/50 rounded-xl border border-slate-800 custom-scrollbar">
                  {availableBranches.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBranch(b.id)}
                      className={`pill transition-all whitespace-nowrap text-[10px] py-1.5 px-3 border ${
                        formData.branchIds.includes(b.id)
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                          : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-in shake duration-300">
                  {Array.isArray(error) ? error.join(", ") : error}
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  className="btn-soft flex-1 py-3 text-slate-400"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 font-bold tracking-wide shadow-lg shadow-indigo-500/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "PROCESANDO..." : "CREAR USUARIO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
