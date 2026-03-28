import { supabase } from './supabase';
import {
  getCurrentUser,
  setUserCategories,
  subscribeToPlan,
  updateUser,
} from './database';
import {
  BUYER_CATEGORY_SCOPE,
  SUPPLIER_CATEGORY_SCOPE,
} from '../lib/profileAdapters';

function buildUserPayload(payload, roleUpdates = {}) {
  return {
    company_name: payload.companyName,
    rut: payload.rut,
    city: payload.city,
    address: payload.address || null,
    description: payload.description || null,
    phone: payload.phone || null,
    whatsapp: payload.whatsapp || null,
    website: payload.website || null,
    ...roleUpdates,
  };
}

async function getCurrentUserWithRetry(attempts = 5, delayMs = 150) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const currentUser = await getCurrentUser();
    if (currentUser) return currentUser;

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

async function syncBuyerProfile(userId, payload) {
  await updateUser(userId, buildUserPayload(payload, { is_buyer: true }));

  const { error } = await supabase.from('buyer_profiles').upsert({
    user_id: userId,
    business_type: payload.businessType,
    monthly_volume: payload.monthlyVolume || null,
    preferred_contact: payload.contactMethod || 'email',
  });

  if (error) throw error;

  await setUserCategories(userId, payload.categoryIds, BUYER_CATEGORY_SCOPE);
  return getCurrentUser();
}

async function syncSupplierProfile(userId, payload) {
  await updateUser(userId, buildUserPayload(payload, { is_supplier: true }));

  const { error } = await supabase.from('supplier_profiles').upsert({
    user_id: userId,
    giro: payload.giro || null,
  });

  if (error) throw error;

  await setUserCategories(userId, payload.categoryIds, SUPPLIER_CATEGORY_SCOPE);

  if (payload.planId) {
    await subscribeToPlan(userId, payload.planId);
  }

  return getCurrentUser();
}

async function createBaseAccount(payload, roleFlags) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: buildUserPayload(payload, roleFlags),
    },
  });

  if (error) throw error;

  return {
    authData: data,
  };
}

export async function createBuyerAccount(payload) {
  const { authData } = await createBaseAccount(payload, {
    is_buyer: true,
    is_supplier: false,
  });

  const currentUser = await getCurrentUserWithRetry();
  if (!currentUser) {
    return {
      requiresEmailConfirmation: !authData.session,
      user: null,
    };
  }

  const user = await syncBuyerProfile(currentUser.id, payload);

  return {
    requiresEmailConfirmation: !authData.session,
    user,
  };
}

export async function createSupplierAccount(payload) {
  const { authData } = await createBaseAccount(payload, {
    is_supplier: true,
    is_buyer: false,
  });

  const currentUser = await getCurrentUserWithRetry();
  if (!currentUser) {
    return {
      requiresEmailConfirmation: !authData.session,
      user: null,
    };
  }

  const user = await syncSupplierProfile(currentUser.id, payload);

  return {
    requiresEmailConfirmation: !authData.session,
    user,
  };
}

export async function saveBuyerRole(userId, payload) {
  return syncBuyerProfile(userId, payload);
}

export async function saveSupplierRole(userId, payload) {
  return syncSupplierProfile(userId, payload);
}
