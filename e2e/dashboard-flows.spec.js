import { expect, test } from '@playwright/test';

async function enableE2EMode(page, role) {
  const sessionId = `${role}-${Date.now()}-${Math.random()}`;
  await page.addInitScript(({ nextRole, nextSessionId }) => {
    window.localStorage.setItem('zentra:e2e', '1');
    window.localStorage.setItem('zentra:e2e:role', nextRole);
    window.localStorage.setItem('zentra:e2e:session', nextSessionId);
  }, { nextRole: role, nextSessionId: sessionId });
}

test.describe('Dashboard Flows', () => {
  test('buyer puede crear una RFQ desde su dashboard', async ({ page }) => {
    await enableE2EMode(page, 'buyer');
    await page.goto('/dashboard-comprador?e2e=1');

    await expect(page.getByText('Panel de comprador')).toBeVisible();

    await page.getByRole('button', { name: 'Nueva cotizacion' }).click();
    await page.getByLabel('Producto necesitado *').fill('Levadura instantanea');
    await page.getByLabel('Categoria').selectOption('cat-1');
    await page.getByLabel('Cantidad *').fill('40');
    await page.getByLabel('Unidad').selectOption('cajas');
    await page.getByLabel('Fecha de entrega requerida *').fill('2026-04-18');
    await page.getByLabel('Notas para proveedores').fill('Entrega antes de las 9 AM');
    await page.getByRole('button', { name: 'Enviar cotizacion' }).click();

    await expect(page.getByText('Cotizacion creada. Ahora los proveedores pueden ofertar.')).toBeVisible();
    await expect(page.getByText('Levadura instantanea')).toBeVisible();
  });

  test('buyer puede aceptar una oferta desde cotizaciones', async ({ page }) => {
    await enableE2EMode(page, 'buyer');
    await page.goto('/dashboard-comprador?e2e=1');

    await page.getByRole('button', { name: 'Cotizaciones' }).click();
    await page.getByRole('button', { name: 'Ver ofertas' }).first().click();
    await page.getByRole('button', { name: 'Aceptar oferta' }).first().click();

    await expect(page.getByText('Oferta aceptada. La cotizacion quedo cerrada.')).toBeVisible();
    await expect(page.getByText('Oferta aceptada', { exact: true })).toBeVisible();
  });

  test('buyer puede crear una alerta de precio por categoria', async ({ page }) => {
    await enableE2EMode(page, 'buyer');
    await page.goto('/dashboard-comprador?e2e=1');

    await page.getByRole('button', { name: 'Alertas' }).click();
    await page.locator('#buyer-alert-category').selectOption('cat-2');
    await page.getByRole('button', { name: 'Guardar alerta' }).click();

    await expect(page.getByText('Alerta de precio activada.')).toBeVisible();
    await expect(page.locator('div.text-sm.font-bold.text-\\[\\#0D1F3C\\]').filter({ hasText: 'Lacteos' })).toBeVisible();
  });

  test('supplier puede responder una RFQ abierta desde quote inbox', async ({ page }) => {
    await enableE2EMode(page, 'supplier');
    await page.goto('/dashboard-proveedor?e2e=1');

    await expect(page.getByText('Panel de proveedor')).toBeVisible();

    await page.getByRole('button', { name: 'Cotizar' }).first().click();
    await page.getByLabel('Precio ofertado (CLP) *').fill('1490');
    await page.getByLabel('Lead time estimado').fill('72 horas');
    await page.getByLabel('Notas adicionales').fill('Incluye coordinacion de entrega');
    await page.getByRole('button', { name: 'Enviar oferta' }).click();

    await expect(page.getByText(/Oferta enviada a Pasteleria Mozart/i)).toBeVisible();
  });

  test('supplier puede cambiar de plan desde la tab plan', async ({ page }) => {
    await enableE2EMode(page, 'supplier');
    await page.goto('/dashboard-proveedor?e2e=1');

    await page.getByRole('button', { name: /^Plan/i }).click();
    await page.getByRole('button', { name: /Cambiar a Enterprise/i }).click();

    await expect(page.getByText('Plan actualizado correctamente.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Plan Enterprise/i })).toBeVisible();
  });
});
