import { getDefaultDashboardPath } from './profileAdapters';

export function getNavbarLinks(user) {
  const publicLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/marketplace', label: 'Marketplace' },
  ];

  if (!user) {
    return [
      ...publicLinks,
      { to: '/registro-comprador', label: 'Soy Comprador' },
      { to: '/registro-proveedor', label: 'Soy Proveedor' },
    ];
  }

  const roleLinks = [];

  if (user.is_admin) {
    roleLinks.push({ to: '/dashboard-admin', label: 'Admin' });
  }

  if (user.is_buyer) {
    roleLinks.push(
      { to: '/dashboard-comprador', label: 'Dashboard Comprador' },
    );
  } else {
    roleLinks.push({ to: '/registro-comprador', label: user ? 'Activar Perfil Comprador' : 'Soy Comprador' });
  }

  if (user.is_supplier) {
    roleLinks.push(
      { to: '/dashboard-proveedor', label: 'Dashboard Proveedor' },
    );
  } else {
    roleLinks.push({ to: '/registro-proveedor', label: user ? 'Activar Perfil Proveedor' : 'Soy Proveedor' });
  }

  return [...publicLinks, ...roleLinks];
}

export function getFooterLinks() {
  return [
    { to: '/marketplace', label: '🧭 Marketplace' },
    { to: '/registro-comprador', label: '🛒 Registro Comprador' },
    { to: '/registro-proveedor', label: '🏪 Registro Proveedor' },
    { to: '/ingresar', label: '🔐 Ingresar' },
  ];
}

export function resolvePostLoginPath(user, nextPath) {
  const defaultPath = getDefaultDashboardPath(user);

  if (!user || !nextPath) return defaultPath;

  if (nextPath === '/dashboard-admin' && user.is_admin) return nextPath;
  if (nextPath === '/dashboard-comprador' && user.is_buyer) return nextPath;
  if (nextPath === '/dashboard-proveedor' && user.is_supplier) return nextPath;
  if (nextPath === '/marketplace' || nextPath === '/') return nextPath;

  return defaultPath;
}

export function getNotificationTargetLocation(notification, user) {
  if (!user || !notification) {
    return { pathname: getDefaultDashboardPath(user) };
  }

  if (user.is_supplier && ['rfq_created', 'offer_accepted', 'rfq_cancelled'].includes(notification.type)) {
    return {
      pathname: '/dashboard-proveedor',
      state: {
        activeTab: 'quotes',
        focusQuoteId: notification.entity_type === 'quote_request' ? notification.entity_id : null,
        focusOfferId: notification.entity_type === 'quote_offer' ? notification.entity_id : null,
      },
    };
  }

  if (user.is_supplier && notification.type === 'message_received') {
    return {
      pathname: '/dashboard-proveedor',
      state: {
        activeTab: 'quotes',
        focusConversationId: notification.entity_type === 'quote_conversation' ? notification.entity_id : null,
      },
    };
  }

  if (user.is_buyer && ['offer_received'].includes(notification.type)) {
    return {
      pathname: '/dashboard-comprador',
      state: {
        activeTab: 'dashboard',
        focusOfferId: notification.entity_type === 'quote_offer' ? notification.entity_id : null,
        focusQuoteId: notification.entity_type === 'quote_request' ? notification.entity_id : null,
      },
    };
  }

  if (user.is_buyer && notification.type === 'message_received') {
    return {
      pathname: '/dashboard-comprador',
      state: {
        activeTab: 'dashboard',
        focusConversationId: notification.entity_type === 'quote_conversation' ? notification.entity_id : null,
      },
    };
  }

  return { pathname: getDefaultDashboardPath(user) };
}
