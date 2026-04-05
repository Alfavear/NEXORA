import { useEffect, useState } from "react";
import { listUsers, createUser } from "../api/users";
import { useAuth } from "../auth/AuthContext";
import { branchesApi } from "../api/branches";
import type { Branch } from "../api/branches";

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
  
  // Estados para el Modal de Creación
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  
  // Campos del Formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    branchIds: [] as number[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, branchesData] = await Promise.all([
        listUsers(),
        branchesApi.list().then(res => res.data)
      ]);
      setUsers(usersData);
      setAvailableBranches(branchesData);
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
    setFormData({ name: "", email: "", password: "", branchIds: [] });
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
    <div className="card p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-slate-500">Gestión de usuarios multi-sede</p>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleOpenModal}
        >
          + Crear usuario
        </button>
      </div>

      {/* MODAL DE CREACIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
          <div className="card w-full max-w-lg p-8 shadow-2xl border-white/20 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">Nuevo Usuario</h2>
            <p className="text-sm text-slate-500 mb-6">Completa los datos para el nuevo vendedor</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Ej: Juan Pérez"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label block mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="juan@nexora.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label block mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="label block mb-1">Asignar Sedes</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                  {availableBranches.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBranch(b.id)}
                      className={`pill transition-all ${
                        formData.branchIds.includes(b.id)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm animate-in shake duration-300">
                  {Array.isArray(error) ? error.join(", ") : error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="btn-soft flex-1"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <th className="text-left px-4 py-3 rounded-r-xl">Estado</th>
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
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="pill-indigo">{u.role.name}</span>
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
                      <span className="pill bg-rose-100 text-rose-800">Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
