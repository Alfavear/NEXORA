import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as AuthAPI from '../api/auth';
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, me, switchBranch } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  const [step, setStep] = useState<"LOGIN" | "PICK_BRANCH">("LOGIN");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const branches = useMemo(() => me?.branches ?? [], [me]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ login con identificador unificado (email o username)
      await login(identifier, password);

      // obtener datos actualizados inmediatamente
      const userData = await AuthAPI.me();
      const meRole = userData.role;
      const branchCount = userData.branches.length;

      if (meRole === 'VENDEDOR' || branchCount > 1) {
        setStep('PICK_BRANCH');
        setSelectedBranchId((userData.branches[0]?.branchId ?? null) as number | null);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  async function confirmBranch() {
    if (!selectedBranchId) {
      setError("Selecciona una sede para continuar");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await switchBranch(selectedBranchId);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo cambiar de sede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md card p-8 border-white/20 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-cyan-400 text-white border border-white/20 flex items-center justify-center font-extrabold">
            N
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">Nexora</div>
            <div className="text-xs text-indigo-100">Accede a tu sede</div>
          </div>
        </div>

        {step === "LOGIN" && (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <div className="label mb-1">Email o Usuario</div>
              <input
                type="text"
                className="input"
                placeholder="juan@nexora.com o juan.perez"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <div className="label mb-1">Contraseña</div>
              <input
                placeholder="Ingresa tu contraseña"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-100 text-rose-900 px-3 py-2 text-sm">
                {Array.isArray(error) ? error.join(", ") : error}
              </div>
            )}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        )}

        {step === "PICK_BRANCH" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
              <div className="text-sm font-semibold text-indigo-900">
                Selecciona tu sede de trabajo
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Tienes acceso a varias sedes. Debes elegir una para continuar.
              </div>
            </div>

            <div>
              <div className="label mb-1">Sede</div>
              <select
                className="input"
                value={selectedBranchId ?? ""}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              >
                {branches.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-100 text-rose-900 px-3 py-2 text-sm">
                {Array.isArray(error) ? error.join(", ") : error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="btn-soft flex-1"
                onClick={() => setStep("LOGIN")}
                disabled={loading}
              >
                Volver
              </button>
              <button
                className="btn-primary flex-1"
                onClick={confirmBranch}
                disabled={loading}
              >
                {loading ? "Aplicando..." : "Continuar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
