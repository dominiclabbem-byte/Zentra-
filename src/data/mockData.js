export const suppliers = [
  { id: 1, name: 'Valle Frio SpA', rut: '76.234.567-8', city: 'Santiago', categories: ['Berries IQF', 'Mix berries', 'Frutas tropicales IQF'], plan: 'pro' },
  { id: 2, name: 'Best Food Chile SpA', rut: '77.891.234-5', city: 'Valparaiso', categories: ['Frutas tropicales IQF', 'Verduras IQF', 'Mix berries'], plan: 'starter' },
  { id: 3, name: 'Surfrut Ltda.', rut: '76.456.789-1', city: 'Rancagua', categories: ['Berries IQF', 'Verduras IQF', 'Mix berries'], plan: 'enterprise' },
];

export const buyers = [
  { id: 1, name: 'Pasteleria Mozart', rut: '72.345.678-9', city: 'Santiago', type: 'Pasteleria' },
  { id: 2, name: 'Hotel Ritz Santiago', rut: '96.789.012-3', city: 'Santiago', type: 'Hotel' },
  { id: 3, name: 'Catering El Toldo Azul', rut: '76.111.222-3', city: 'Concepcion', type: 'Catering' },
];

export const quoteRequests = [
  {
    id: 1,
    buyer: 'Pasteleria Mozart',
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
    message: 'Frambuesa IQF bajo a $4.200/kg',
    supplier: 'Valle Frio SpA',
    change: 'down',
    date: '2026-03-16',
  },
  {
    id: 2,
    product: 'Arandano IQF',
    message: 'Arandano IQF subio a $6.800/kg',
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
  'Pasteleria',
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
    features: ['Email automatizado', 'Hasta 50 contactos/mes', 'Reportes basicos', 'Soporte por email'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$280.000',
    period: '/mes',
    features: ['Email + WhatsApp', '200 llamadas IA incluidas', 'Hasta 200 contactos/mes', 'Agentes de venta IA', 'Reportes avanzados', 'Soporte prioritario'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$400.000',
    period: '/mes',
    features: ['Agente IA con voz personalizada', 'Agentes de venta IA ilimitados', 'Contactos ilimitados', 'CRM integrado', 'Gerente de cuenta dedicado', 'API access'],
    highlight: false,
  },
];

export const supplierProducts = [
  {
    id: 1,
    name: 'Frambuesa IQF Premium',
    category: 'Berries IQF',
    price: '$4.200/kg',
    stock: '2.500 kg',
    description: 'Frambuesas seleccionadas, congeladas individualmente. Calibre 20-25mm. Origen: Region del Maule.',
    status: 'active',
    gradient: 'from-rose-400 to-red-500',
    emoji: '🫐',
    imageAlt: 'Frambuesas IQF congeladas individualmente',
  },
  {
    id: 2,
    name: 'Arandano IQF Select',
    category: 'Berries IQF',
    price: '$6.800/kg',
    stock: '1.800 kg',
    description: 'Arandanos cultivados premium, congelacion rapida IQF. Calibre 12-18mm. Certificacion BRC.',
    status: 'active',
    gradient: 'from-indigo-400 to-purple-600',
    emoji: '🫐',
    imageAlt: 'Arandanos IQF seleccionados',
  },
  {
    id: 3,
    name: 'Mix Berries Premium',
    category: 'Mix berries',
    price: '$5.100/kg',
    stock: '3.200 kg',
    description: 'Mezcla de frambuesa, arandano, mora y frutilla. Proporcion balanceada. Ideal para smoothies y reposteria.',
    status: 'active',
    gradient: 'from-fuchsia-400 to-pink-600',
    emoji: '🍓',
    imageAlt: 'Mix de berries congelados premium',
  },
  {
    id: 4,
    name: 'Mango en Cubo IQF',
    category: 'Frutas tropicales IQF',
    price: '$3.900/kg',
    stock: '4.000 kg',
    description: 'Mango Kent cortado en cubos de 15mm. Sin fibra. Grado Brix 14-18. Origen: Peru.',
    status: 'active',
    gradient: 'from-amber-300 to-orange-500',
    emoji: '🥭',
    imageAlt: 'Cubos de mango IQF',
  },
  {
    id: 5,
    name: 'Mora IQF Silvestre',
    category: 'Berries IQF',
    price: '$5.500/kg',
    stock: '900 kg',
    description: 'Moras silvestres seleccionadas, proceso IQF. Calibre variado. Sabor intenso para pasteleria gourmet.',
    status: 'low_stock',
    gradient: 'from-violet-500 to-purple-800',
    emoji: '🫐',
    imageAlt: 'Moras silvestres IQF',
  },
  {
    id: 6,
    name: 'Frutilla IQF Entera',
    category: 'Berries IQF',
    price: '$3.600/kg',
    stock: '5.100 kg',
    description: 'Frutillas enteras congeladas IQF. Calibre 25-35mm. Origen: Region de O\'Higgins. Color rojo intenso.',
    status: 'active',
    gradient: 'from-red-400 to-rose-600',
    emoji: '🍓',
    imageAlt: 'Frutillas enteras IQF',
  },
];

export const salesAgents = [
  {
    id: 1,
    name: 'Agente Sofia',
    avatar: 'S',
    status: 'active',
    type: 'WhatsApp + Email',
    conversationsToday: 12,
    conversionsThisWeek: 8,
    satisfaction: '96%',
    lastActivity: 'Hace 3 min',
    recentConversations: [
      { id: 1, contact: 'Pasteleria Mozart', channel: 'WhatsApp', message: 'Buenos dias! Le envio cotizacion de Frambuesa IQF a $4.200/kg con despacho incluido.', time: '14:32', status: 'sent' },
      { id: 2, contact: 'Hotel Ritz Santiago', channel: 'Email', message: 'Estimados, adjunto ficha tecnica de Mix Berries Premium. Quedo atenta a sus consultas.', time: '14:15', status: 'read' },
      { id: 3, contact: 'Catering El Toldo Azul', channel: 'WhatsApp', message: 'Perfecto! Agendo despacho para el viernes 21. Confirmo direccion: Av. Los Leones 1520, Concepcion.', time: '13:50', status: 'replied' },
    ],
  },
  {
    id: 2,
    name: 'Agente Carlos',
    avatar: 'C',
    status: 'active',
    type: 'Llamadas IA',
    conversationsToday: 8,
    conversionsThisWeek: 5,
    satisfaction: '93%',
    lastActivity: 'Hace 12 min',
    recentConversations: [
      { id: 4, contact: 'Restaurante Don Pepe', channel: 'Llamada', message: 'Llamada de 4:32 min. Cliente interesado en Arandano IQF 200kg. Seguimiento agendado.', time: '13:20', status: 'completed' },
      { id: 5, contact: 'Sushi Express', channel: 'Llamada', message: 'Llamada de 2:15 min. Solicito muestra de Mango en cubo. Envio programado.', time: '12:45', status: 'completed' },
    ],
  },
  {
    id: 3,
    name: 'Agente Valentina',
    avatar: 'V',
    status: 'paused',
    type: 'Email automatizado',
    conversationsToday: 0,
    conversionsThisWeek: 3,
    satisfaction: '91%',
    lastActivity: 'Hace 2 hrs',
    recentConversations: [
      { id: 6, contact: 'Panaderia San Jose', channel: 'Email', message: 'Campaña de re-engagement enviada a 15 prospectos inactivos.', time: '11:00', status: 'sent' },
    ],
  },
];
