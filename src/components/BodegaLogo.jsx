import zentraLogo from '../assets/zentra_logo.png';

export default function BodegaLogo({ size = 32 }) {
  return (
    <img
      src={zentraLogo}
      alt="Zentra - El Mercado Gastronómico de Chile"
      style={{ height: size, width: 'auto' }}
    />
  );
}
