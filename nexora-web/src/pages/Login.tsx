import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, me, switchBranch } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("juan@nexora.com");
  const [password, setPassword] = useState("Vendedor123*");
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
      // ✅ Opción A: login sin branchId
      await login(email, password);

      // si tiene más de 1 sede, obligamos a escoger
      const count = (me?.branches?.length ?? 0);


      // Nota: me puede tardar un tick, por eso usamos branches memo (y fallback)
      // Si por timing no está aún, igual el siguiente render lo tendrá.
      if ((branches.length || count) > 1) {
        setStep("PICK_BRANCH");
        setSelectedBranchId((branches[0]?.branchId ?? null) as number | null);
      } else {
        navigate("/");
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-200/60 border border-indigo-200 flex items-center justify-center font-bold">
            N
          </div>
          <div>
            <div className="text-lg font-semibold">Nexora</div>
            <div className="text-xs text-slate-500">Accede a tu sede</div>
          </div>
        </div>

        {step === "LOGIN" && (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <div className="label mb-1">Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="label mb-1">Contraseña</div>
              <input
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
