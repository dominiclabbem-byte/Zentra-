import ZChat from '../components/ZChat';
import { supplierProfiles, buyerProfiles } from '../data/mockData';

export default function ZChatPage() {
  const session = (() => { try { return JSON.parse(localStorage.getItem('zentra_session')); } catch { return null; } })();
  const isSupplier = session?.role === 'proveedor';

  return (
    <div className="bg-[#f0f6ff] min-h-screen px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <ZChat
          contacts={isSupplier ? buyerProfiles : supplierProfiles}
          userLabel={isSupplier ? 'Proveedor — Valle Frio SpA' : 'Comprador — Pasteleria Mozart'}
        />
      </div>
    </div>
  );
}
