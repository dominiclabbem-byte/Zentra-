import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import mainLogo from '../assets/zentra_main_logo.png';
import { useAuth } from '../context/AuthContext';

function formatNotificationDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    notifications,
    unreadNotificationsCount,
    readAllNotifications,
    readNotification,
    logout,
  } = useAuth();

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/registro-comprador', label: currentUser?.is_buyer ? 'Perfil Comprador' : 'Soy Comprador' },
    { to: '/registro-proveedor', label: currentUser?.is_supplier ? 'Perfil Proveedor' : 'Soy Proveedor' },
    ...(currentUser?.is_admin ? [{ to: '/dashboard-admin', label: 'Admin' }] : []),
    ...(currentUser?.is_buyer ? [{ to: '/dashboard-comprador', label: 'Dashboard Comprador' }] : []),
    ...(currentUser?.is_supplier ? [{ to: '/dashboard-proveedor', label: 'Dashboard Proveedor' }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  const visibleNotifications = useMemo(
    () => notifications.slice(0, 8),
    [notifications],
  );

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    function handlePointerDown(event) {
      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [notificationsOpen]);

  const handleNotificationClick = async (notification) => {
    if (notification && !notification.read_at) {
      await readNotification(notification.id);
    }

    setNotificationsOpen(false);

    if (currentUser?.is_supplier && ['rfq_created', 'offer_accepted', 'rfq_cancelled'].includes(notification.type)) {
      navigate('/dashboard-proveedor');
      return;
    }

    if (currentUser?.is_buyer && ['offer_received'].includes(notification.type)) {
      navigate('/dashboard-comprador');
      return;
    }

    if (currentUser?.is_buyer) {
      navigate('/dashboard-comprador');
    } else if (currentUser?.is_supplier) {
      navigate('/dashboard-proveedor');
    }
  };

  return (
    <nav className="bg-[#0a1628]/95 backdrop-blur-xl text-white shadow-[0_1px_0_rgba(46,202,213,0.1)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1 flex-shrink-0 group">
            <div className="transition-all hover:scale-105">
              <img
                src={mainLogo}
                alt="Zentra AI"
                style={{
                  width: '120px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))',
                }}
              />
            </div>
            <div className="flex flex-col justify-center -ml-4">
              <span className="text-3xl font-extrabold tracking-tight">
                zentra<span className="text-emerald-400">.</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECAD5] to-blue-500">ai</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-lg shadow-emerald-400/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {currentUser ? (
              <>
                <div ref={notificationsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((open) => !open)}
                    className="relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white hover:bg-white/5"
                    aria-label="Notificaciones"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9a6 6 0 00-12 0v.05-.05v.7a8.967 8.967 0 01-2.31 6.022c1.733.64 3.56 1.084 5.454 1.31m5.713 0a24.255 24.255 0 01-5.713 0m5.713 0a3 3 0 11-5.713 0" />
                    </svg>
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-400 text-[#0D1F3C] text-[10px] font-bold flex items-center justify-center">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#12233b] bg-[#09172a] shadow-2xl shadow-black/40 overflow-hidden z-50">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
                        <div>
                          <div className="text-sm font-bold text-white">Notificaciones</div>
                          <div className="text-[11px] text-gray-400">{unreadNotificationsCount} sin leer</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => readAllNotifications()}
                          className="text-[11px] font-semibold text-[#2ECAD5] hover:text-white transition-colors"
                        >
                          Marcar todas
                        </button>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {visibleNotifications.length > 0 ? (
                          visibleNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-[#10233d] ${
                                notification.read_at ? 'bg-[#09172a]' : 'bg-[#0f2037]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-white">{notification.title}</div>
                                  <div className="text-xs text-gray-300 mt-1 leading-relaxed">{notification.message}</div>
                                  <div className="text-[11px] text-gray-500 mt-2">{formatNotificationDate(notification.created_at)}</div>
                                </div>
                                {!notification.read_at && <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-10 text-center text-sm text-gray-400">
                            Aun no tienes notificaciones.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-3 py-2 text-xs font-semibold text-gray-400">
                  {currentUser.company_name}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Cerrar sesion
                </button>
              </>
            ) : (
              <Link
                to="/ingresar"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/ingresar'
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-lg shadow-emerald-400/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Ingresar
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0a1628]/98 backdrop-blur-xl border-t border-[#2ECAD5]/10 animate-fade-in">
          <div className="py-2 px-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all ${
                  location.pathname === link.to
                    ? 'text-[#2ECAD5] bg-[#2ECAD5]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Notificaciones {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ''}
                </button>
                {notificationsOpen && (
                  <div className="px-2 pb-2">
                    <div className="rounded-2xl border border-[#12233b] bg-[#09172a] overflow-hidden">
                      {visibleNotifications.length > 0 ? (
                        visibleNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              handleNotificationClick(notification);
                              setMenuOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-3 border-b border-white/5 last:border-b-0 ${
                              notification.read_at ? 'bg-[#09172a]' : 'bg-[#0f2037]'
                            }`}
                          >
                            <div className="text-sm font-semibold text-white">{notification.title}</div>
                            <div className="text-xs text-gray-300 mt-1">{notification.message}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-sm text-gray-400">Aun no tienes notificaciones.</div>
                      )}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Cerrar sesion
                </button>
              </>
            ) : (
              <Link
                to="/ingresar"
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all ${
                  location.pathname === '/ingresar'
                    ? 'text-[#2ECAD5] bg-[#2ECAD5]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
