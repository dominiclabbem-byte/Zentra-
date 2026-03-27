const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function generateProductImage(prompt) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: `Generate a professional product photo for a B2B food marketplace. The product is: ${prompt}. The image should have a clean white background, professional studio lighting, high quality, product catalog style. Only generate the image, no text.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Error al generar la imagen');
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  if (!message) {
    throw new Error('No se recibió respuesta del modelo');
  }

  // The model returns images in message.images array
  // Format: [{ type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }]
  if (message.images && message.images.length > 0) {
    const firstImage = message.images[0];
    if (firstImage.image_url?.url) {
      return firstImage.image_url.url;
    }
    if (typeof firstImage === 'string') {
      return firstImage;
    }
  }

  // Fallback: check content if it's an array with image parts
  const content = message.content;
  if (Array.isArray(content)) {
    const imagePart = content.find(
      (part) => part.type === 'image_url' || part.type === 'image'
    );
    if (imagePart) {
      return imagePart.image_url?.url || imagePart.url || imagePart.data;
    }
  }

  // Fallback: check content as string for base64
  if (typeof content === 'string' && content) {
    const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (base64Match) {
      return base64Match[0];
    }
  }

  throw new Error('El modelo no generó una imagen. Intenta con otra descripción más detallada.');
}
