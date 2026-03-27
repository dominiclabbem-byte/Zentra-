/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { categories as fallbackCategoryNames } from '../data/mockData';
import { getCategories, getCurrentUser, getPlans, signIn, signOut, subscribeToPlan } from '../services/database';
import { supabase } from '../services/supabase';
import { createBuyerAccount, createSupplierAccount, saveBuyerRole, saveSupplierRole } from '../services/accountService';
import { normalizeUserRecord } from '../lib/profileAdapters';

const FALLBACK_PLAN_ROWS = [
  { id: 'starter', name: 'starter', price_clp: 150000, has_agents: false, has_voice_calls: false, has_crm: false, has_api: false, max_active_products: 25, max_quote_responses_per_month: 20, max_ai_conversations_per_month: 0, max_voice_calls_per_month: 0 },
  { id: 'pro', name: 'pro', price_clp: 280000, has_agents: true, has_voice_calls: true, has_crm: false, has_api: false, max_active_products: 200, max_quote_responses_per_month: 250, max_ai_conversations_per_month: 200, max_voice_calls_per_month: 200 },
  { id: 'enterprise', name: 'enterprise', price_clp: 400000, has_agents: true, has_voice_calls: true, has_crm: true, has_api: true, max_active_products: null, max_quote_responses_per_month: null, max_ai_conversations_per_month: null, max_voice_calls_per_month: null },
];

const FALLBACK_CATEGORY_ROWS = fallbackCategoryNames.map((name) => ({
  id: name,
  name,
  emoji: '🍽️',
}));

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState(FALLBACK_CATEGORY_ROWS);
  const [plans, setPlans] = useState(FALLBACK_PLAN_ROWS);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(normalizeUserRecord(user));
      return normalizeUserRecord(user);
    } catch {
      setCurrentUser(null);
      return null;
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const [categoryRows, planRows] = await Promise.all([getCategories(), getPlans()]);

      if (Array.isArray(categoryRows) && categoryRows.length) {
        setCategories(categoryRows);
      }

      if (Array.isArray(planRows) && planRows.length) {
        setPlans(planRows);
      }
    } catch {
      setCategories(FALLBACK_CATEGORY_ROWS);
      setPlans(FALLBACK_PLAN_ROWS);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      await Promise.all([loadOptions(), refreshCurrentUser()]);

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshCurrentUser();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadOptions, refreshCurrentUser]);

  const login = useCallback(async ({ email, password }) => {
    await signIn({ email, password });
    return refreshCurrentUser();
  }, [refreshCurrentUser]);

  const logout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
  }, []);

  const registerBuyer = useCallback(async (payload) => {
    const result = await createBuyerAccount(payload);
    const normalized = normalizeUserRecord(result.user);
    setCurrentUser(normalized);
    return { ...result, user: normalized };
  }, []);

  const registerSupplier = useCallback(async (payload) => {
    const result = await createSupplierAccount(payload);
    const normalized = normalizeUserRecord(result.user);
    setCurrentUser(normalized);
    return { ...result, user: normalized };
  }, []);

  const saveBuyerProfile = useCallback(async (payload) => {
    if (!currentUser?.id) {
      throw new Error('No hay una sesion activa para actualizar el perfil comprador.');
    }

    const user = await saveBuyerRole(currentUser.id, payload);
    const normalized = normalizeUserRecord(user);
    setCurrentUser(normalized);
    return normalized;
  }, [currentUser]);

  const saveSupplierProfile = useCallback(async (payload) => {
    if (!currentUser?.id) {
      throw new Error('No hay una sesion activa para actualizar el perfil proveedor.');
    }

    const user = await saveSupplierRole(currentUser.id, payload);
    const normalized = normalizeUserRecord(user);
    setCurrentUser(normalized);
    return normalized;
  }, [currentUser]);

  const changeSupplierPlan = useCallback(async (planId) => {
    if (!currentUser?.id) {
      throw new Error('No hay una sesion activa para cambiar el plan.');
    }

    await subscribeToPlan(currentUser.id, planId);
    return refreshCurrentUser();
  }, [currentUser, refreshCurrentUser]);

  const value = useMemo(() => ({
    currentUser,
    categories,
    plans,
    isLoading,
    login,
    logout,
    registerBuyer,
    registerSupplier,
    saveBuyerProfile,
    saveSupplierProfile,
    changeSupplierPlan,
    refreshCurrentUser,
  }), [
    categories,
    currentUser,
    isLoading,
    login,
    logout,
    plans,
    refreshCurrentUser,
    registerBuyer,
    registerSupplier,
    saveBuyerProfile,
    saveSupplierProfile,
    changeSupplierPlan,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
