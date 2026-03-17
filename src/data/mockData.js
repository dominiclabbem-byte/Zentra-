export const suppliers = [
  { id: 1, name: 'Valle Frío SpA', rut: '76.234.567-8', city: 'Santiago', categories: ['Berries IQF', 'Mix berries', 'Frutas tropicales IQF'] },
  { id: 2, name: 'Best Food Chile SpA', rut: '77.891.234-5', city: 'Valparaíso', categories: ['Frutas tropicales IQF', 'Verduras IQF', 'Mix berries'] },
  { id: 3, name: 'Surfrut Ltda.', rut: '76.456.789-1', city: 'Rancagua', categories: ['Berries IQF', 'Verduras IQF', 'Mix berries'] },
];

export const buyers = [
  { id: 1, name: 'Pastelería Mozart', rut: '72.345.678-9', city: 'Santiago', type: 'Pastelería' },
  { id: 2, name: 'Hotel Ritz Santiago', rut: '96.789.012-3', city: 'Santiago', type: 'Hotel' },
  { id: 3, name: 'Catering El Toldo Azul', rut: '76.111.222-3', city: 'Concepción', type: 'Catering' },
];

export const quoteRequests = [
  {
    id: 1,
    buyer: 'Pastelería Mozart',
    product: 'Frambuesa IQF',
    quantity: '500 kg',
    date: '2026-03-15',
    status: 'Recibiendo ofertas',
    statusColor: 'blue',
  },
  {
    id: 2,
    buyer: 'Hotel Ritz Santiago',
    product: 'Mix berries',
    quantity: '200 kg',
    date: '2026-03-14',
    status: '3 ofertas recibidas',
    statusColor: 'green',
  },
  {
    id: 3,
    buyer: 'Catering El Toldo Azul',
    product: 'Mango en cubo IQF',
    quantity: '300 kg',
    date: '2026-03-13',
    status: 'Recibiendo ofertas',
    statusColor: 'blue',
  },
];

export const priceAlerts = [
  {
    id: 1,
    product: 'Frambuesa IQF',
    message: 'Frambuesa IQF bajó a $4.200/kg',
    supplier: 'Valle Frío SpA',
    change: 'down',
    date: '2026-03-16',
  },
  {
    id: 2,
    product: 'Arándano IQF',
    message: 'Arándano IQF subió a $6.800/kg',
    supplier: 'Surfrut Ltda.',
    change: 'up',
    date: '2026-03-15',
  },
];

export const supplierStats = {
  activeBuyers: 24,
  quotesThisMonth: 18,
  conversionRate: '38%',
};

export const categories = [
  'Berries IQF',
  'Frutas tropicales IQF',
  'Verduras IQF',
  'Mix berries',
  'Otros',
];

export const businessTypes = [
  'Restaurante',
  'Pastelería',
  'Hotel',
  'Catering',
  'Industria',
];

export const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$150.000',
    period: '/mes',
    features: ['Email automatizado', 'Hasta 50 contactos/mes', 'Reportes básicos', 'Soporte por email'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$280.000',
    period: '/mes',
    features: ['Email + WhatsApp', '200 llamadas IA incluidas', 'Hasta 200 contactos/mes', 'Reportes avanzados', 'Soporte prioritario'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$400.000',
    period: '/mes',
    features: ['Agente IA con voz personalizada', 'Contactos ilimitados', 'CRM integrado', 'Gerente de cuenta dedicado', 'API access'],
    highlight: false,
  },
];
