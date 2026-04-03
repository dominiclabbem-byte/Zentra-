function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-CL').format(Number(value) || 0);
}

export const OFFER_PIPELINE_OPTIONS = [
  { value: 'submitted', label: 'Enviada' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'negotiation', label: 'Negociacion' },
  { value: 'won', label: 'Ganada' },
  { value: 'lost', label: 'Perdida' },
];

export const EDITABLE_OFFER_PIPELINE_OPTIONS = OFFER_PIPELINE_OPTIONS.filter((option) => (
  ['submitted', 'follow_up', 'negotiation'].includes(option.value)
));

export function parseLeadTimeDays(value) {
  const match = String(value ?? '').match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return Number.POSITIVE_INFINITY;

  const start = Number(match[1]) || Number.POSITIVE_INFINITY;
  const end = Number(match[2] ?? match[1]) || start;
  return Math.min(start, end);
}

export function formatQuoteDate(value) {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatQuoteDateTime(value) {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatQuoteStatus(status, offerCount = 0) {
  const countLabel = `${offerCount} ${offerCount === 1 ? 'oferta' : 'ofertas'}`;

  switch (status) {
    case 'open':
      return {
        label: offerCount > 0 ? countLabel : 'Abierta',
        badgeClass: offerCount > 0
          ? 'bg-blue-50 text-blue-600 border border-blue-100'
          : 'bg-slate-100 text-slate-600 border border-slate-200',
      };
    case 'in_review':
      return {
        label: countLabel,
        badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      };
    case 'closed':
      return {
        label: 'Cerrada',
        badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
      };
    case 'cancelled':
      return {
        label: 'Cancelada',
        badgeClass: 'bg-rose-50 text-rose-600 border border-rose-100',
      };
    default:
      return {
        label: status || 'Sin estado',
        badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
      };
  }
}

export function formatOfferStatus(status) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pendiente',
        badgeClass: 'bg-amber-50 text-amber-600 border border-amber-100',
      };
    case 'accepted':
      return {
        label: 'Aceptada',
        badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      };
    case 'rejected':
      return {
        label: 'Rechazada',
        badgeClass: 'bg-rose-50 text-rose-600 border border-rose-100',
      };
    case 'withdrawn':
      return {
        label: 'Retirada',
        badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
      };
    default:
      return {
        label: status || 'Sin estado',
        badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
      };
  }
}

export function getDefaultOfferPipelineStatus(status) {
  switch (status) {
    case 'accepted':
      return 'won';
    case 'rejected':
    case 'withdrawn':
      return 'lost';
    default:
      return 'submitted';
  }
}

export function formatOfferPipelineStatus(status) {
  switch (status) {
    case 'submitted':
      return {
        label: 'Enviada',
        badgeClass: 'bg-blue-50 text-blue-600 border border-blue-100',
      };
    case 'follow_up':
      return {
        label: 'Seguimiento',
        badgeClass: 'bg-amber-50 text-amber-600 border border-amber-100',
      };
    case 'negotiation':
      return {
        label: 'Negociacion',
        badgeClass: 'bg-violet-50 text-violet-600 border border-violet-100',
      };
    case 'won':
      return {
        label: 'Ganada',
        badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      };
    case 'lost':
      return {
        label: 'Perdida',
        badgeClass: 'bg-rose-50 text-rose-600 border border-rose-100',
      };
    default:
      return {
        label: status || 'Sin pipeline',
        badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
      };
  }
}

export function mapQuoteOfferRecord(record) {
  const supplier = takeSingle(record.users);
  const quote = takeSingle(record.quote_requests);
  const buyer = takeSingle(quote?.users);
  const statusMeta = formatOfferStatus(record.status);
  const pipelineStatus = record.pipeline_status ?? getDefaultOfferPipelineStatus(record.status);
  const pipelineMeta = formatOfferPipelineStatus(pipelineStatus);

  return {
    id: record.id,
    quoteId: record.quote_id ?? quote?.id ?? '',
    supplierId: record.supplier_id,
    buyerId: quote?.buyer_id ?? '',
    supplierName: supplier?.company_name ?? '',
    supplierCity: supplier?.city ?? '',
    supplierVerified: Boolean(supplier?.verified),
    buyerName: buyer?.company_name ?? '',
    buyerCity: buyer?.city ?? '',
    buyerRut: buyer?.rut ?? '',
    buyerVerified: Boolean(buyer?.verified),
    priceValue: Number(record.price) || 0,
    priceLabel: `$${formatNumber(record.price)}`,
    notes: record.notes ?? '',
    estimatedLeadTime: record.estimated_lead_time ?? 'Sin definir',
    status: record.status ?? 'pending',
    statusLabel: statusMeta.label,
    statusClass: statusMeta.badgeClass,
    pipelineStatus,
    pipelineStatusLabel: pipelineMeta.label,
    pipelineStatusClass: pipelineMeta.badgeClass,
    createdAt: record.created_at ?? '',
    createdAtLabel: formatQuoteDateTime(record.created_at),
    quote: quote
      ? {
          id: quote.id,
          buyerId: quote.buyer_id ?? '',
          productName: quote.product_name,
          categoryName: takeSingle(quote.categories)?.name ?? 'Sin categoria',
          quantityLabel: `${formatNumber(quote.quantity)} ${quote.unit}`,
          deliveryDateLabel: formatQuoteDate(quote.delivery_date),
          status: quote.status,
        }
      : null,
  };
}

export function sortQuoteOffersForBuyer(offers = []) {
  return [...offers].sort((left, right) => {
    if (left.priceValue !== right.priceValue) {
      return left.priceValue - right.priceValue;
    }

    const leftLeadTime = parseLeadTimeDays(left.estimatedLeadTime);
    const rightLeadTime = parseLeadTimeDays(right.estimatedLeadTime);
    if (leftLeadTime !== rightLeadTime) {
      return leftLeadTime - rightLeadTime;
    }

    if (left.supplierVerified !== right.supplierVerified) {
      return left.supplierVerified ? -1 : 1;
    }

    return (right.supplierRating ?? 0) - (left.supplierRating ?? 0);
  });
}

export function mapQuoteRequestRecord(record) {
  const buyer = takeSingle(record.users);
  const category = takeSingle(record.categories);
  const offers = Array.isArray(record.quote_offers)
    ? record.quote_offers.map((offer) => mapQuoteOfferRecord(offer))
    : [];
  const statusMeta = formatQuoteStatus(record.status, offers.length);

  return {
    id: record.id,
    buyerId: record.buyer_id,
    requesterId: record.requester_id,
    buyerName: buyer?.company_name ?? '',
    buyerCity: buyer?.city ?? '',
    buyerRut: buyer?.rut ?? '',
    buyerVerified: Boolean(buyer?.verified),
    productName: record.product_name,
    categoryId: record.category_id ?? '',
    categoryName: category?.name ?? 'Sin categoria',
    quantityValue: Number(record.quantity) || 0,
    quantityLabel: `${formatNumber(record.quantity)} ${record.unit}`,
    unit: record.unit ?? 'kg',
    deliveryDate: record.delivery_date ?? '',
    deliveryDateLabel: formatQuoteDate(record.delivery_date),
    notes: record.notes ?? '',
    status: record.status ?? 'open',
    statusLabel: statusMeta.label,
    statusClass: statusMeta.badgeClass,
    createdAt: record.created_at ?? '',
    createdAtLabel: formatQuoteDateTime(record.created_at),
    offerCount: offers.length,
    offers,
  };
}
