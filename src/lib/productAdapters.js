export const PRODUCT_GRADIENTS = [
  'from-rose-400 to-red-500',
  'from-indigo-400 to-purple-600',
  'from-amber-300 to-orange-500',
  'from-lime-400 to-emerald-500',
  'from-fuchsia-400 to-pink-600',
  'from-violet-500 to-purple-800',
  'from-cyan-400 to-blue-500',
  'from-yellow-300 to-orange-400',
  'from-teal-400 to-emerald-600',
  'from-stone-300 to-amber-400',
];

export const PRODUCT_EMOJIS = {
  'Congelados IQF': '🧊',
  Lacteos: '🧀',
  'Carnes y cecinas': '🥩',
  'Harinas y cereales': '🌾',
  'Aceites y grasas': '🫒',
  Abarrotes: '📦',
  'Frutas y verduras': '🥬',
  'Especias y condimentos': '🧂',
  'Frutos secos': '🥜',
  Legumbres: '🫘',
  Otros: '🍽️',
};

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function hashValue(value) {
  return Array.from(String(value)).reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-CL').format(Number(value) || 0);
}

export function deriveProductStatus(stockValue) {
  const stock = Number(stockValue) || 0;
  if (stock <= 0) return 'inactive';
  if (stock <= 25) return 'low_stock';
  return 'active';
}

export function createEmptyProductForm(defaultCategory = 'Otros') {
  return {
    name: '',
    category: defaultCategory,
    price: '',
    priceUnit: 'kg',
    stock: '',
    stockUnit: 'kg',
    description: '',
    images: [],
    imagePreviews: [],
  };
}

export function buildProductFormFromCard(product) {
  return {
    name: product.name,
    category: product.category,
    price: product.priceValue,
    priceUnit: product.priceUnit,
    stock: product.stockValue,
    stockUnit: product.stockUnit,
    description: product.description,
    images: [],
    imagePreviews: product.imageUrls || [],
  };
}

export function mapProductRecordToCard(record) {
  const categoryRelation = takeSingle(record.categories);
  const supplierRelation = takeSingle(record.users);
  const categoryName = categoryRelation?.name ?? 'Otros';
  const gradient = PRODUCT_GRADIENTS[hashValue(record.id) % PRODUCT_GRADIENTS.length];

  return {
    id: record.id,
    supplierId: record.supplier_id,
    supplierName: supplierRelation?.company_name ?? '',
    supplierCity: supplierRelation?.city ?? '',
    supplierVerified: Boolean(supplierRelation?.verified),
    name: record.name,
    category: categoryName,
    categoryId: record.category_id,
    price: `$${formatNumber(record.price)}/${record.price_unit}`,
    priceValue: String(record.price ?? ''),
    priceUnit: record.price_unit ?? 'kg',
    stock: `${formatNumber(record.stock)} ${record.stock_unit}`,
    stockValue: String(record.stock ?? ''),
    stockUnit: record.stock_unit ?? 'kg',
    description: record.description ?? '',
    status: record.status ?? 'active',
    gradient,
    emoji: categoryRelation?.emoji ?? PRODUCT_EMOJIS[categoryName] ?? '🍽️',
    imageAlt: record.name,
    customImage: record.image_url ?? null,
    imageUrls: record.image_urls?.length ? record.image_urls : (record.image_url ? [record.image_url] : []),
    createdAt: record.created_at ?? null,
  };
}
