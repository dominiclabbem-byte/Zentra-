function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function buildLimitState(limitValue, usedValue = 0) {
  const limit = normalizeLimit(limitValue);
  const used = Math.max(0, Number(usedValue) || 0);
  const unlimited = limit === null;
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const percent = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return {
    limit,
    used,
    unlimited,
    remaining,
    reached: !unlimited && used >= limit,
    percent,
  };
}

export function getSupplierEntitlements(plan, usage = {}) {
  const productLimit = buildLimitState(plan?.max_active_products, usage.activeProducts ?? 0);
  const quoteResponseLimit = buildLimitState(
    plan?.max_quote_responses_per_month,
    usage.quoteResponsesThisMonth ?? 0,
  );
  const aiConversationLimit = buildLimitState(
    plan?.max_ai_conversations_per_month,
    usage.aiConversationsThisMonth ?? 0,
  );
  const voiceCallLimit = buildLimitState(
    plan?.max_voice_calls_per_month,
    usage.voiceCallsThisMonth ?? 0,
  );

  const hasAgents = Boolean(plan?.has_agents);
  const hasVoiceCalls = Boolean(plan?.has_voice_calls);
  const hasCrm = Boolean(plan?.has_crm);
  const hasApi = Boolean(plan?.has_api);

  return {
    hasAgents,
    hasVoiceCalls,
    hasCrm,
    hasApi,
    productLimit,
    quoteResponseLimit,
    aiConversationLimit,
    voiceCallLimit,
    canCreateProduct: !productLimit.reached,
    canRespondToQuotes: !quoteResponseLimit.reached,
    canUseAgents: hasAgents && !aiConversationLimit.reached,
    canUseVoiceCalls: hasAgents && hasVoiceCalls && !voiceCallLimit.reached,
  };
}

export function formatLimitLabel(limitState, unitLabel) {
  if (limitState.unlimited) {
    return `Ilimitado ${unitLabel}`;
  }

  return `${limitState.used}/${limitState.limit} ${unitLabel}`;
}
