import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategories, getPlans } from '../services/database';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [categoryRows, planRows] = await Promise.all([getCategories(), getPlans()]);
      if (!cancelled) {
        setCategories(categoryRows ?? []);
        setPlans(planRows ?? []);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ui-page px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent">Admin</p>
          <h1 className="text-3xl font-extrabold text-brand-ink mt-2">Panel de administracion</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Cuenta administradora: {currentUser?.company_name}. Este panel queda listo para validar el backfill, revisar el catalogo semilla y navegar las rutas del sitio.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-brand-inkDark text-white rounded-2xl p-5">
            <div className="text-sm text-gray-400">Categorias cargadas</div>
            <div className="text-3xl font-extrabold mt-2">{categories.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500">Planes disponibles</div>
            <div className="text-3xl font-extrabold text-brand-ink mt-2">{plans.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="text-sm text-gray-500">Estado</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">Activo</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-brand-ink">Checklist de backfill</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>Usuarios auth creados con cuentas de prueba.</li>
              <li>Perfiles buyer, supplier y admin enlazados a `users`.</li>
              <li>Productos, RFQs, ofertas, favoritos, alertas y reseñas cargados.</li>
              <li>Agentes IA y conversaciones semilla listos para probar el workspace supplier.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-brand-ink">Rutas utiles</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><span className="font-semibold">Marketplace:</span> `/marketplace`</p>
              <p><span className="font-semibold">Buyer:</span> `/dashboard-comprador`</p>
              <p><span className="font-semibold">Supplier:</span> `/dashboard-proveedor`</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
