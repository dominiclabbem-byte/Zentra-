import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const supabaseUrl = process.env.SUPABASE_TEST_URL;
const supabaseAnonKey = process.env.SUPABASE_TEST_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

let adminClient;
const authIdsToCleanup = new Set();

function createAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, clientOptions);
}

function createRut(prefix = 'rut') {
  const safePrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 11);

  return `${safePrefix}-${randomUUID().slice(0, 8)}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForPublicUser(authId, attempts = 20, delayMs = 150) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    if (attempt < attempts - 1) {
      await wait(delayMs);
    }
  }

  throw new Error(`No aparecio la fila en public.users para auth_id=${authId}`);
}

async function createConfirmedUser({ email, password, metadata }) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) throw error;

  authIdsToCleanup.add(data.user.id);
  return data.user;
}

async function signInWithPassword(email, password) {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function getAnyCategoryId() {
  const { data, error } = await adminClient
    .from('categories')
    .select('id')
    .limit(1)
    .single();

  if (error) throw error;
  return data.id;
}

beforeAll(() => {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error(
      'Faltan SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY o SUPABASE_TEST_SERVICE_ROLE_KEY. Usa `npm run test:supabase:local`.',
    );
  }

  adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, clientOptions);
});

afterEach(async () => {
  const authIds = [...authIdsToCleanup];
  authIdsToCleanup.clear();

  for (const authId of authIds) {
    const { error } = await adminClient.auth.admin.deleteUser(authId);
    if (error && !`${error.message}`.includes('User not found')) {
      throw error;
    }
  }
});

describe('Supabase local integration', () => {
  it('signUp crea el usuario auth y lo espeja a public.users mediante trigger', async () => {
    const email = `buyer.${randomUUID()}@zentra.local`;
    const password = 'SuperSecreta123';
    const anonClient = createAnonClient();

    const { data, error } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: 'Compras Mozart',
          rut: createRut('buyer'),
          city: 'Santiago',
          is_buyer: true,
          is_supplier: false,
        },
      },
    });

    expect(error).toBeNull();
    expect(data.user).toBeTruthy();

    authIdsToCleanup.add(data.user.id);

    const publicUser = await waitForPublicUser(data.user.id);
    expect(publicUser.email).toBe(email);
    expect(publicUser.company_name).toBe('Compras Mozart');
    expect(publicUser.city).toBe('Santiago');
    expect(publicUser.is_buyer).toBe(true);
    expect(publicUser.is_supplier).toBe(false);
  });

  it('rechaza un segundo signUp cuando el RUT ya existe', async () => {
    const password = 'SuperSecreta123';
    const duplicatedRut = createRut('duplicated');
    const firstEmail = `buyer.${randomUUID()}@zentra.local`;
    const secondEmail = `buyer.${randomUUID()}@zentra.local`;

    const firstSignUp = await createAnonClient().auth.signUp({
      email: firstEmail,
      password,
      options: {
        data: {
          company_name: 'Comprador Base',
          rut: duplicatedRut,
          city: 'Santiago',
          is_buyer: true,
          is_supplier: false,
        },
      },
    });

    expect(firstSignUp.error).toBeNull();
    authIdsToCleanup.add(firstSignUp.data.user.id);
    await waitForPublicUser(firstSignUp.data.user.id);

    const secondSignUp = await createAnonClient().auth.signUp({
      email: secondEmail,
      password,
      options: {
        data: {
          company_name: 'Comprador Duplicado',
          rut: duplicatedRut,
          city: 'Santiago',
          is_buyer: true,
          is_supplier: false,
        },
      },
    });

    if (secondSignUp.data?.user?.id) {
      authIdsToCleanup.add(secondSignUp.data.user.id);
    }

    expect(secondSignUp.error).toBeTruthy();
    expect(`${secondSignUp.error.message}`.toLowerCase()).toMatch(
      /database error saving new user|duplicate key|users_rut_key/,
    );
  });

  it('permite insertar notificaciones como actor autenticado, bloquea su lectura y habilita la del destinatario', async () => {
    const password = 'SuperSecreta123';
    const actorUser = await createConfirmedUser({
      email: `actor.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Comprador Actor',
        rut: createRut('actor'),
        city: 'Santiago',
        is_buyer: true,
        is_supplier: false,
      },
    });
    const recipientUser = await createConfirmedUser({
      email: `recipient.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Proveedor Destino',
        rut: createRut('recipient'),
        city: 'Valparaiso',
        is_buyer: false,
        is_supplier: true,
      },
    });

    const actorPublicUser = await waitForPublicUser(actorUser.id);
    const recipientPublicUser = await waitForPublicUser(recipientUser.id);
    const actorClient = await signInWithPassword(actorUser.email, password);
    const recipientClient = await signInWithPassword(recipientUser.email, password);
    const uniqueTitle = `RFQ ${randomUUID()}`;

    const { error: insertError } = await actorClient
      .from('notifications')
      .insert({
        recipient_id: recipientPublicUser.id,
        actor_id: actorPublicUser.id,
        type: 'rfq_created',
        title: uniqueTitle,
        message: 'Nueva RFQ creada para prueba local.',
        entity_type: 'quote_request',
        entity_id: randomUUID(),
      });

    expect(insertError).toBeNull();

    const { data: persistedNotification, error: persistedError } = await adminClient
      .from('notifications')
      .select('*')
      .eq('title', uniqueTitle)
      .single();

    expect(persistedError).toBeNull();
    expect(persistedNotification.recipient_id).toBe(recipientPublicUser.id);

    const { data: actorView, error: actorReadError } = await actorClient
      .from('notifications')
      .select('*')
      .eq('id', persistedNotification.id)
      .maybeSingle();

    expect(actorReadError).toBeNull();
    expect(actorView).toBeNull();

    const { data: recipientView, error: recipientReadError } = await recipientClient
      .from('notifications')
      .select('*')
      .eq('id', persistedNotification.id)
      .single();

    expect(recipientReadError).toBeNull();
    expect(recipientView.title).toBe(uniqueTitle);

    const readAt = new Date().toISOString();
    const { error: markReadError } = await recipientClient
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', persistedNotification.id);

    expect(markReadError).toBeNull();

    const { data: updatedNotification, error: updatedError } = await adminClient
      .from('notifications')
      .select('read_at')
      .eq('id', persistedNotification.id)
      .single();

    expect(updatedError).toBeNull();
    expect(updatedNotification.read_at).not.toBeNull();
  });

  it('no permite que un actor marque como leida una notificacion ajena', async () => {
    const password = 'SuperSecreta123';
    const actorUser = await createConfirmedUser({
      email: `actor.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Comprador Actor',
        rut: createRut('actor-update'),
        city: 'Santiago',
        is_buyer: true,
        is_supplier: false,
      },
    });
    const recipientUser = await createConfirmedUser({
      email: `recipient.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Proveedor Destino',
        rut: createRut('recipient-update'),
        city: 'Valparaiso',
        is_buyer: false,
        is_supplier: true,
      },
    });

    const actorPublicUser = await waitForPublicUser(actorUser.id);
    const recipientPublicUser = await waitForPublicUser(recipientUser.id);
    const actorClient = await signInWithPassword(actorUser.email, password);
    const title = `RFQ ${randomUUID()}`;

    const { error: insertError } = await actorClient
      .from('notifications')
      .insert({
        recipient_id: recipientPublicUser.id,
        actor_id: actorPublicUser.id,
        type: 'rfq_created',
        title,
        message: 'Nueva RFQ creada para prueba local.',
        entity_type: 'quote_request',
        entity_id: randomUUID(),
      });

    expect(insertError).toBeNull();

    const { data: persistedNotification } = await adminClient
      .from('notifications')
      .select('*')
      .eq('title', title)
      .single();

    const { error: actorUpdateError } = await actorClient
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', persistedNotification.id);

    expect(actorUpdateError).toBeNull();

    const { data: unchangedNotification, error: unchangedError } = await adminClient
      .from('notifications')
      .select('read_at')
      .eq('id', persistedNotification.id)
      .single();

    expect(unchangedError).toBeNull();
    expect(unchangedNotification.read_at).toBeNull();
  });

  it('permite registrar actividad buyer propia y bloquea su lectura desde otro usuario', async () => {
    const password = 'SuperSecreta123';
    const buyerUser = await createConfirmedUser({
      email: `buyer.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Buyer Activity',
        rut: createRut('buyer-activity'),
        city: 'Santiago',
        is_buyer: true,
        is_supplier: false,
      },
    });
    const outsiderUser = await createConfirmedUser({
      email: `outsider.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Outsider Activity',
        rut: createRut('outsider-activity'),
        city: 'Valparaiso',
        is_buyer: false,
        is_supplier: true,
      },
    });

    const buyerPublicUser = await waitForPublicUser(buyerUser.id);
    const buyerClient = await signInWithPassword(buyerUser.email, password);
    const outsiderClient = await signInWithPassword(outsiderUser.email, password);
    const categoryId = await getAnyCategoryId();

    const { data: createdEvent, error: createEventError } = await buyerClient
      .from('buyer_activity_events')
      .insert({
        buyer_id: buyerPublicUser.id,
        event_type: 'search',
        category_id: categoryId,
        search_term: 'harina premium',
        metadata: { source: 'test' },
      })
      .select('*')
      .single();

    expect(createEventError).toBeNull();
    expect(createdEvent.buyer_id).toBe(buyerPublicUser.id);

    const { data: buyerEvents, error: buyerEventsError } = await buyerClient
      .from('buyer_activity_events')
      .select('*')
      .eq('id', createdEvent.id);

    expect(buyerEventsError).toBeNull();
    expect(buyerEvents).toHaveLength(1);

    const { data: outsiderEvents, error: outsiderEventsError } = await outsiderClient
      .from('buyer_activity_events')
      .select('*')
      .eq('id', createdEvent.id);

    expect(outsiderEventsError).toBeNull();
    expect(outsiderEvents).toHaveLength(0);
  });

  it('permite que un buyer cree una RFQ y que un supplier responda con una oferta bajo RLS real', async () => {
    const password = 'SuperSecreta123';
    const buyerUser = await createConfirmedUser({
      email: `buyer.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Buyer Real',
        rut: createRut('buyer-rfq'),
        city: 'Santiago',
        is_buyer: true,
        is_supplier: false,
      },
    });
    const supplierUser = await createConfirmedUser({
      email: `supplier.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Supplier Real',
        rut: createRut('supplier-offer'),
        city: 'Concepcion',
        is_buyer: false,
        is_supplier: true,
      },
    });

    const buyerPublicUser = await waitForPublicUser(buyerUser.id);
    const supplierPublicUser = await waitForPublicUser(supplierUser.id);
    const buyerClient = await signInWithPassword(buyerUser.email, password);
    const supplierClient = await signInWithPassword(supplierUser.email, password);
    const categoryId = await getAnyCategoryId();

    const { data: createdQuote, error: createQuoteError } = await buyerClient
      .from('quote_requests')
      .insert({
        buyer_id: buyerPublicUser.id,
        requester_id: buyerPublicUser.id,
        product_name: 'Harina premium local',
        category_id: categoryId,
        quantity: 120,
        unit: 'kg',
        delivery_date: '2026-04-10',
        notes: 'Entrega AM',
      })
      .select('*')
      .single();

    expect(createQuoteError).toBeNull();
    expect(createdQuote.buyer_id).toBe(buyerPublicUser.id);

    const { data: createdOffer, error: createOfferError } = await supplierClient
      .from('quote_offers')
      .insert({
        quote_id: createdQuote.id,
        supplier_id: supplierPublicUser.id,
        responder_id: supplierPublicUser.id,
        price: 1490,
        notes: 'Incluye despacho local',
        estimated_lead_time: '48 horas',
      })
      .select('*')
      .single();

    expect(createOfferError).toBeNull();
    expect(createdOffer.quote_id).toBe(createdQuote.id);
    expect(createdOffer.supplier_id).toBe(supplierPublicUser.id);
  });

  it('crea una conversacion por oferta y restringe sus mensajes a los participantes', async () => {
    const password = 'SuperSecreta123';
    const buyerUser = await createConfirmedUser({
      email: `buyer.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Buyer Chat',
        rut: createRut('buyer-chat'),
        city: 'Santiago',
        is_buyer: true,
        is_supplier: false,
      },
    });
    const supplierUser = await createConfirmedUser({
      email: `supplier.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Supplier Chat',
        rut: createRut('supplier-chat'),
        city: 'Valdivia',
        is_buyer: false,
        is_supplier: true,
      },
    });
    const outsiderUser = await createConfirmedUser({
      email: `outsider.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Proveedor Ajeno',
        rut: createRut('outsider-chat'),
        city: 'Temuco',
        is_buyer: false,
        is_supplier: true,
      },
    });

    const buyerPublicUser = await waitForPublicUser(buyerUser.id);
    const supplierPublicUser = await waitForPublicUser(supplierUser.id);
    const buyerClient = await signInWithPassword(buyerUser.email, password);
    const supplierClient = await signInWithPassword(supplierUser.email, password);
    const outsiderClient = await signInWithPassword(outsiderUser.email, password);
    const categoryId = await getAnyCategoryId();

    const { data: quote } = await buyerClient
      .from('quote_requests')
      .insert({
        buyer_id: buyerPublicUser.id,
        requester_id: buyerPublicUser.id,
        product_name: 'Chat harina local',
        category_id: categoryId,
        quantity: 80,
        unit: 'kg',
        delivery_date: '2026-04-12',
        notes: 'Entrega PM',
      })
      .select('*')
      .single();

    const { data: offer } = await supplierClient
      .from('quote_offers')
      .insert({
        quote_id: quote.id,
        supplier_id: supplierPublicUser.id,
        responder_id: supplierPublicUser.id,
        price: 1750,
        notes: 'Oferta con despacho',
        estimated_lead_time: '72 horas',
      })
      .select('*')
      .single();

    expect(offer.quote_id).toBe(quote.id);

    const { data: conversation, error: conversationError } = await adminClient
      .from('quote_conversations')
      .select('*')
      .eq('quote_request_id', quote.id)
      .eq('supplier_user_id', supplierPublicUser.id)
      .single();

    expect(conversationError).toBeNull();
    expect(conversation.buyer_user_id).toBe(buyerPublicUser.id);

    const { data: buyerMessage, error: buyerMessageError } = await buyerClient
      .from('quote_conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_user_id: buyerPublicUser.id,
        body: 'Podemos recibir antes de las 9 AM?',
      })
      .select('*')
      .single();

    expect(buyerMessageError).toBeNull();
    expect(buyerMessage.sender_user_id).toBe(buyerPublicUser.id);

    const { data: supplierMessages, error: supplierMessagesError } = await supplierClient
      .from('quote_conversation_messages')
      .select('*')
      .eq('conversation_id', conversation.id);

    expect(supplierMessagesError).toBeNull();
    expect(supplierMessages).toHaveLength(1);

    const { data: outsiderConversation, error: outsiderConversationError } = await outsiderClient
      .from('quote_conversations')
      .select('*')
      .eq('id', conversation.id)
      .maybeSingle();

    expect(outsiderConversationError).toBeNull();
    expect(outsiderConversation).toBeNull();

    const secondSupplierUser = await createConfirmedUser({
      email: `supplier.${randomUUID()}@zentra.local`,
      password,
      metadata: {
        company_name: 'Supplier Dos',
        rut: createRut('supplier-two'),
        city: 'Puerto Montt',
        is_buyer: false,
        is_supplier: true,
      },
    });
    const secondSupplierPublicUser = await waitForPublicUser(secondSupplierUser.id);
    const secondSupplierClient = await signInWithPassword(secondSupplierUser.email, password);

    const { data: secondOffer, error: secondOfferError } = await secondSupplierClient
      .from('quote_offers')
      .insert({
        quote_id: quote.id,
        supplier_id: secondSupplierPublicUser.id,
        responder_id: secondSupplierPublicUser.id,
        price: 1820,
        notes: 'Segunda oferta',
        estimated_lead_time: '96 horas',
      })
      .select('*')
      .single();

    expect(secondOfferError).toBeNull();
    expect(secondOffer.quote_id).toBe(quote.id);

    const { data: secondSupplierConversation, error: secondSupplierConversationError } = await secondSupplierClient
      .from('quote_conversations')
      .select('*')
      .eq('id', conversation.id)
      .maybeSingle();

    expect(secondSupplierConversationError).toBeNull();
    expect(secondSupplierConversation).toBeNull();

    const { error: closeQuoteError } = await buyerClient
      .from('quote_requests')
      .update({ status: 'cancelled' })
      .eq('id', quote.id);

    expect(closeQuoteError).toBeNull();

    const { error: closedMessageError } = await supplierClient
      .from('quote_conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_user_id: supplierPublicUser.id,
        body: 'Este mensaje no deberia entrar.',
      });

    expect(closedMessageError).toBeTruthy();
  });
});
