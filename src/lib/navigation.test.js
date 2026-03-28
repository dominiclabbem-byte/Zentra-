import { describe, expect, it } from 'vitest';
import {
  getFooterLinks,
  getNavbarLinks,
  getNotificationTargetLocation,
  resolvePostLoginPath,
} from './navigation';

describe('navigation helpers', () => {
  const buyerUser = {
    is_admin: false,
    is_buyer: true,
    is_supplier: false,
  };

  const supplierUser = {
    is_admin: false,
    is_buyer: false,
    is_supplier: true,
  };

  it('resuelve offer_received de buyer hacia cotizaciones con state contextual', () => {
    expect(getNotificationTargetLocation({
      type: 'offer_received',
      entity_type: 'quote_offer',
      entity_id: 'offer-1',
    }, buyerUser)).toEqual({
      pathname: '/dashboard-comprador',
      state: {
        activeTab: 'dashboard',
        focusOfferId: 'offer-1',
        focusQuoteId: null,
      },
    });
  });

  it('resuelve rfq_created de supplier hacia quote inbox con quote focus', () => {
    expect(getNotificationTargetLocation({
      type: 'rfq_created',
      entity_type: 'quote_request',
      entity_id: 'quote-1',
    }, supplierUser)).toEqual({
      pathname: '/dashboard-proveedor',
      state: {
        activeTab: 'quotes',
        focusQuoteId: 'quote-1',
        focusOfferId: null,
      },
    });
  });

  it('resuelve offer_accepted de supplier hacia quote inbox con offer focus', () => {
    expect(getNotificationTargetLocation({
      type: 'offer_accepted',
      entity_type: 'quote_offer',
      entity_id: 'offer-2',
    }, supplierUser)).toEqual({
      pathname: '/dashboard-proveedor',
      state: {
        activeTab: 'quotes',
        focusQuoteId: null,
        focusOfferId: 'offer-2',
      },
    });
  });

  it('cae al dashboard por defecto si la notificacion no tiene ruta contextual', () => {
    expect(getNotificationTargetLocation({
      type: 'generic',
      entity_type: 'other',
      entity_id: 'x-1',
    }, supplierUser)).toEqual({
      pathname: '/dashboard-proveedor',
    });
  });

  it('resuelve el post-login a un dashboard valido para el rol actual', () => {
    expect(resolvePostLoginPath(buyerUser, '/registro-proveedor')).toBe('/dashboard-comprador');
    expect(resolvePostLoginPath(supplierUser, '/dashboard-proveedor')).toBe('/dashboard-proveedor');
  });

  it('muestra links de activacion solo para los roles faltantes', () => {
    const links = getNavbarLinks(buyerUser);
    expect(links.some((link) => link.label === 'Dashboard Comprador')).toBe(true);
    expect(links.some((link) => link.label === 'Activar Perfil Proveedor')).toBe(true);
    expect(links.some((link) => link.label === 'Activar Perfil Comprador')).toBe(false);
  });

  it('deja el footer en superficie publica', () => {
    const labels = getFooterLinks().map((link) => link.label);
    expect(labels).toContain('🧭 Marketplace');
    expect(labels).toContain('🔐 Ingresar');
    expect(labels).not.toContain('Dashboard Comprador');
    expect(labels).not.toContain('Dashboard Proveedor');
  });
});
