import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { me } = useAuth();
  if (!me) return <div className="p-6">Cargando...</div>;

  return (
    <div className="card p-6">
      <div className="text-sm text-slate-500">Resumen</div>
      <h1 className="text-2xl font-semibold mt-1">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi title="Rol" value={me.role} />
        <Kpi title="Sede activa" value={me.branchName ?? "-"} />
        <Kpi title="Usuario" value={me.name} />
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
