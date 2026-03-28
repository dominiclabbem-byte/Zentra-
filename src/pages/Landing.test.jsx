import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';
import Landing from './Landing';

describe('Landing', () => {
  it('abre y cierra el modal de autenticacion para proveedor', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Landing />);

    await user.click(screen.getByRole('button', { name: /Soy Proveedor/i }));

    expect(screen.getByRole('heading', { name: 'Proveedor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('heading', { name: 'Proveedor' })).not.toBeInTheDocument();
  });
});
