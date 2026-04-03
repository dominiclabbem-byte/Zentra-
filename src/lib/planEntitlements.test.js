import { describe, expect, it } from 'vitest';
import {
  buildLimitState,
  formatLimitLabel,
  getSupplierEntitlements,
} from './planEntitlements';

describe('planEntitlements', () => {
  it('calcula limites alcanzados y remanentes', () => {
    expect(buildLimitState(20, 7)).toMatchObject({
      limit: 20,
      used: 7,
      remaining: 13,
      reached: false,
      percent: 35,
    });

    expect(buildLimitState(null, 50)).toMatchObject({
      unlimited: true,
      reached: false,
      remaining: null,
    });
  });

  it('deriva gates supplier para starter, pro y enterprise', () => {
    const starter = getSupplierEntitlements({
      has_agents: false,
      has_voice_calls: false,
      has_crm: false,
      has_api: false,
      max_active_products: 10,
      max_quote_responses_per_month: 5,
      max_ai_conversations_per_month: 0,
      max_voice_calls_per_month: 0,
    }, {
      activeProducts: 10,
      quoteResponsesThisMonth: 4,
      aiConversationsThisMonth: 0,
      voiceCallsThisMonth: 0,
    });

    const pro = getSupplierEntitlements({
      has_agents: true,
      has_voice_calls: true,
      has_crm: false,
      has_api: false,
      max_active_products: 100,
      max_quote_responses_per_month: 80,
      max_ai_conversations_per_month: 120,
      max_voice_calls_per_month: 200,
    }, {
      activeProducts: 12,
      quoteResponsesThisMonth: 15,
      aiConversationsThisMonth: 120,
      voiceCallsThisMonth: 40,
    });

    const enterprise = getSupplierEntitlements({
      has_agents: true,
      has_voice_calls: true,
      has_crm: true,
      has_api: true,
      max_active_products: null,
      max_quote_responses_per_month: null,
      max_ai_conversations_per_month: null,
      max_voice_calls_per_month: null,
    }, {
      activeProducts: 999,
      quoteResponsesThisMonth: 999,
      aiConversationsThisMonth: 999,
      voiceCallsThisMonth: 999,
    });

    expect(starter.canCreateProduct).toBe(false);
    expect(starter.canUseAgents).toBe(false);
    expect(starter.canUseVoiceCalls).toBe(false);

    expect(pro.hasAgents).toBe(true);
    expect(pro.canRespondToQuotes).toBe(true);
    expect(pro.canUseAgents).toBe(false);
    expect(pro.canUseVoiceCalls).toBe(true);

    expect(enterprise.canCreateProduct).toBe(true);
    expect(enterprise.canRespondToQuotes).toBe(true);
    expect(enterprise.canUseAgents).toBe(true);
    expect(enterprise.hasCrm).toBe(true);
    expect(enterprise.hasApi).toBe(true);
  });

  it('formatea labels de uso mensual', () => {
    expect(formatLimitLabel(buildLimitState(50, 20), 'RFQs')).toBe('20/50 RFQs');
    expect(formatLimitLabel(buildLimitState(null, 2), 'productos')).toBe('Ilimitado productos');
  });
});
