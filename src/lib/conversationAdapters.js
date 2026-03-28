import { formatQuoteDate, formatQuoteDateTime } from './quoteAdapters';

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function mapQuoteConversationRecord(record) {
  if (!record) return null;

  const quote = takeSingle(record.quote_requests);
  const buyer = takeSingle(record.buyer);
  const supplier = takeSingle(record.supplier);

  return {
    id: record.id,
    quoteRequestId: record.quote_request_id ?? quote?.id ?? '',
    buyerUserId: record.buyer_user_id ?? buyer?.id ?? '',
    supplierUserId: record.supplier_user_id ?? supplier?.id ?? '',
    startedByUserId: record.started_by_user_id ?? '',
    status: record.status ?? 'active',
    isClosed: (record.status ?? 'active') !== 'active',
    buyerLastReadAt: record.buyer_last_read_at ?? null,
    supplierLastReadAt: record.supplier_last_read_at ?? null,
    lastMessageAt: record.last_message_at ?? null,
    lastMessageAtLabel: formatQuoteDateTime(record.last_message_at),
    createdAt: record.created_at ?? null,
    quote: quote ? {
      id: quote.id,
      productName: quote.product_name ?? 'RFQ',
      categoryId: quote.category_id ?? '',
      categoryName: takeSingle(quote.categories)?.name ?? 'Sin categoria',
      quantityLabel: `${Number(quote.quantity) || 0} ${quote.unit ?? 'kg'}`,
      deliveryDateLabel: formatQuoteDate(quote.delivery_date),
      status: quote.status ?? 'open',
    } : null,
    buyer: buyer ? {
      id: buyer.id,
      companyName: buyer.company_name ?? 'Comprador',
      city: buyer.city ?? '',
    } : null,
    supplier: supplier ? {
      id: supplier.id,
      companyName: supplier.company_name ?? 'Proveedor',
      city: supplier.city ?? '',
      verified: Boolean(supplier.verified),
    } : null,
  };
}

export function mapQuoteConversationMessageRecord(record) {
  if (!record) return null;

  const sender = takeSingle(record.sender);

  return {
    id: record.id,
    conversationId: record.conversation_id,
    senderUserId: record.sender_user_id,
    senderName: sender?.company_name ?? 'Usuario',
    body: record.body ?? '',
    createdAt: record.created_at ?? null,
    createdAtLabel: formatQuoteDateTime(record.created_at),
  };
}
