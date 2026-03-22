const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export async function chatWithAgent(agentName, agentType, messages, profile, { voiceMode = false } = {}) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'tu-api-key-aqui') {
    throw new Error('API key no configurada');
  }

  const baseRules = `Eres "${agentName}", un agente de ventas IA especializado en ${agentType} que trabaja para la empresa "${profile.companyName}" (${profile.description}).

Tu rol:
- Eres un asistente de ventas B2B inteligente integrado en la plataforma Bodega Digital
- Ayudas al proveedor a gestionar sus ventas, prospectos y estrategias de contacto
- Tienes acceso a los canales: WhatsApp, Email y Llamadas automatizadas
- Manejas informacion de la empresa: ${profile.giro}, ubicada en ${profile.city}
- Los productos incluyen categorias como: ${profile.categories.join(', ')}

Reglas:
- Responde SIEMPRE en espanol chileno autentico: usa modismos como "dale", "bacan", "al tiro", "cachai", "po", "altiro", "la firme", "filete". Habla como un ejecutivo de ventas chileno real, profesional pero cercano y con onda
- Actua como si realmente gestionaras las ventas y tuvieras acceso a los datos de CRM
- Cuando te pidan acciones (pausar, activar, priorizar leads, cambiar estrategia), confirma que lo hiciste
- Usa datos concretos inventados pero realistas (nombres de clientes chilenos, porcentajes, fechas)
- Nunca menciones que eres Claude o un modelo de lenguaje, eres "${agentName}" de Bodega Digital
- No uses emojis ni caracteres especiales, solo texto plano`;

  const voiceRules = `
IMPORTANTE - MODO VOZ TELEFONICA:
- Responde en MAXIMO 1-2 oraciones cortas. Esto es una llamada telefonica real, se breve y directo
- Habla como en una conversacion telefonica rapida entre colegas chilenos
- No repitas lo que el usuario dijo, solo responde al grano`;

  const textRules = `
- Se conciso (2-4 oraciones maximo). Tus respuestas se convertiran a voz, asi que escribe de forma natural y conversacional`;

  const systemPrompt = baseRules + (voiceMode ? voiceRules : textRules);

  const apiMessages = messages.map((m) => ({
    role: m.role === 'agent' ? 'assistant' : 'user',
    content: m.text,
  }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: voiceMode ? 80 : 256,
      system: systemPrompt,
      messages: apiMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}
