/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { categories as fallbackCategoryNames } from '../data/mockData';
import {
  getCategories,
  getCurrentUser,
  getNotifications,
  getPlans,
  markAllNotificationsRead,
  markNotificationRead,
  requestFlowPlanActivation,
  signIn,
  signOut,
  subscribeToPlan,
} from '../services/database';
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
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const refreshCurrentUserPromiseRef = useRef(null);

  const refreshCurrentUser = useCallback(async () => {
    if (refreshCurrentUserPromiseRef.current) {
      return refreshCurrentUserPromiseRef.current;
    }

    const refreshPromise = (async () => {
      try {
        const user = await getCurrentUser();
        const normalizedUser = normalizeUserRecord(user);
        setCurrentUser(normalizedUser);
        return normalizedUser;
      } catch {
        setCurrentUser(null);
        return null;
      } finally {
        refreshCurrentUserPromiseRef.current = null;
      }
    })();

    refreshCurrentUserPromiseRef.current = refreshPromise;

    try {
      return await refreshPromise;
    } catch {
      return null;
    } finally {
      refreshCurrentUserPromiseRef.current = null;
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

  const refreshNotifications = useCallback(async (userIdOverride) => {
    const targetUserId = userIdOverride ?? currentUser?.id;
    if (!targetUserId) {
      setNotifications([]);
      return [];
    }

    try {
      const rows = await getNotifications(targetUserId);
      setNotifications(rows);
      return rows;
    } catch {
      return [];
    }
  }, [currentUser?.id]);

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
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setNotifications([]);
        return;
      }

      refreshCurrentUser();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadOptions, refreshCurrentUser]);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      return undefined;
    }

    refreshNotifications(currentUser.id);

    const interval = window.setInterval(() => {
      refreshNotifications(currentUser.id);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [currentUser?.id, refreshNotifications]);

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

  const requestSupplierPlanBilling = useCallback(async (planId) => {
    if (!currentUser?.id) {
      throw new Error('No hay una sesion activa para preparar el billing.');
    }

    await requestFlowPlanActivation(currentUser.id, planId, currentUser.email);
    return refreshCurrentUser();
  }, [currentUser, refreshCurrentUser]);

  const readNotification = useCallback(async (notificationId) => {
    if (!currentUser?.id) return null;

    await markNotificationRead(notificationId, currentUser.id);
    return refreshNotifications(currentUser.id);
  }, [currentUser, refreshNotifications]);

  const readAllNotifications = useCallback(async () => {
    if (!currentUser?.id) return;

    await markAllNotificationsRead(currentUser.id);
    await refreshNotifications(currentUser.id);
  }, [currentUser, refreshNotifications]);

  const value = useMemo(() => ({
    currentUser,
    categories,
    plans,
    notifications,
    unreadNotificationsCount: notifications.filter((notification) => !notification.read_at).length,
    isLoading,
    login,
    logout,
    registerBuyer,
    registerSupplier,
    saveBuyerProfile,
    saveSupplierProfile,
    changeSupplierPlan,
    requestSupplierPlanBilling,
    refreshNotifications,
    readNotification,
    readAllNotifications,
    refreshCurrentUser,
  }), [
    categories,
    currentUser,
    isLoading,
    login,
    logout,
    notifications,
    plans,
    readAllNotifications,
    readNotification,
    refreshNotifications,
    refreshCurrentUser,
    registerBuyer,
    registerSupplier,
    saveBuyerProfile,
    saveSupplierProfile,
    changeSupplierPlan,
    requestSupplierPlanBilling,
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
