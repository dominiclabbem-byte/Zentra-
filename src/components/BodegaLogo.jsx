import mainLogo from '../assets/zentra_main_logo.png';

export default function BodegaLogo({ size = 32 }) {
  return (
    <img
      src={mainLogo}
      alt="Zentra AI"
      style={{ height: size, width: 'auto' }}
    />
  );
}
