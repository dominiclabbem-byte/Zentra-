const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Daniel - voz masculina expresiva y natural
const VOICE_ID = 'onwK4e9ZLuTAKqWW03F9';

let currentAudio = null;
let currentSource = null;

export async function speakText(text, { onStart, onEnd } = {}) {
  if (ELEVENLABS_API_KEY) {
    return speakWithElevenLabs(text, { onStart, onEnd });
  }
  return speakWithBrowser(text, { onStart, onEnd });
}

export function stopSpeaking() {
  if (currentSource) {
    try { currentSource.stop(); } catch {
      // Ignore repeated stop attempts from browsers with partial WebAudio support.
    }
    currentSource = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

async function speakWithElevenLabs(text, { onStart, onEnd } = {}) {
  try {
    // Usar endpoint de streaming con maxima optimizacion de latencia
    // output_format=mp3_22050_32 = menor calidad pero mucho mas rapido
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream?optimize_streaming_latency=4&output_format=mp3_22050_32`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 0.3,
            similarity_boost: 0.85,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!res.ok) throw new Error(`ElevenLabs TTS error: ${res.status}`);

    // Collect all chunks quickly then play
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const audio = new Audio(url);
      currentAudio = audio;
      audio.playbackRate = 1.12;

      audio.onplay = () => onStart?.();
      audio.onended = () => {
        onEnd?.();
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        onEnd?.();
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };

      audio.play().catch(() => {
        onEnd?.();
        resolve();
      });
    });
  } catch {
    return speakWithBrowser(text, { onStart, onEnd });
  }
}

function speakWithBrowser(text, { onStart, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CL';
    utterance.rate = 0.88;
    utterance.pitch = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith('es')) || voices[0];
    if (esVoice) utterance.voice = esVoice;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => { onEnd?.(); resolve(); };
    utterance.onerror = () => { onEnd?.(); resolve(); };

    window.speechSynthesis.speak(utterance);
  });
}
