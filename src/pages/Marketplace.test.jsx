import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ExternalContactValue from '../components/ExternalContactValue';
import { buildMarketplaceSeed } from '../test/marketplaceFixtures';

describe('Marketplace', () => {
  const seed = buildMarketplaceSeed();

  it('renderiza la web del proveedor como link externo clickeable', () => {
    render(<ExternalContactValue label="Web" value={seed.supplier.website} />);

    const websiteLink = screen.getByRole('link', { name: 'www.vallefrio.cl' });
    expect(websiteLink).toHaveAttribute('href', 'https://www.vallefrio.cl');
    expect(websiteLink).toHaveAttribute('target', '_blank');
  });
});
