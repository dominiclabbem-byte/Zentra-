function normalizeExternalUrl(value) {
  const trimmedValue = String(value ?? '').trim();
  if (!trimmedValue) return '';
  return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
}

export default function ExternalContactValue({ label, value, className = '' }) {
  if (!value) return '-';

  if (label !== 'Web') {
    return value;
  }

  return (
    <a
      href={normalizeExternalUrl(value)}
      target="_blank"
      rel="noreferrer"
      className={`text-brand-accent hover:underline break-all ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      {value}
    </a>
  );
}
