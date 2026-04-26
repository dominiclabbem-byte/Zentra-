import { useState, useEffect, useRef } from 'react';
import { chatWithAgent } from '../services/claudeApi';
import { speakText, stopSpeaking } from '../services/ttsService';
import RenderProfiler from './RenderProfiler';

export default function VoiceCall({ agent, profile, onClose }) {
  const [phase, setPhase] = useState('starting');  // starting | listening | thinking | speaking
  const [transcript, setTranscript] = useState('');
  const [agentText, setAgentText] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [callLog, setCallLog] = useState([]);
  const [debug, setDebug] = useState('Iniciando llamada...');

  const alive = useRef(true);
  const msgs = useRef([]);
  const recRef = useRef(null);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ---- CORE: speak, then listen, loop ----

  async function agentSpeak(text) {
    if (!alive.current) return;
    setPhase('speaking');
    setAgentText(text);
    setDebug('Generando voz ElevenLabs...');

    const agentMsg = { role: 'agent', text };
    msgs.current = [...msgs.current, agentMsg];
    setCallLog((prev) => [...prev, agentMsg]);

    try {
      await speakText(text, {
        onStart: () => setDebug('Carlos hablando...'),
        onEnd: () => {},
      });
    } catch (e) {
      setDebug('Error voz: ' + e.message);
    }

    if (!alive.current) return;
    setAgentText('');
    startListening();
  }

  function startListening() {
    if (!alive.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setDebug('ERROR: navegador sin soporte de voz');
      return;
    }

    // Kill previous
    try { recRef.current?.stop(); } catch {
      // Ignore stale speech-recognition teardown errors.
    }

    const rec = new SR();
    rec.lang = 'es-CL';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    recRef.current = rec;

    let final = '';
    let sent = false;
    let silenceTimeout = null;

    setPhase('listening');
    setTranscript('');
    setDebug('Microfono activo - habla ahora');

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim = e.results[i][0].transcript;
        }
      }

      const currentText = final || interim;
      setTranscript(currentText);
      setDebug(final ? `Captado: "${final}"` : `Escuchando: "${interim}"`);

      // Clear previous timeout
      if (silenceTimeout) clearTimeout(silenceTimeout);

      // Set new timeout to forcefully stop and process if user stops speaking
      // 1.2 seconds of silence means they finished speaking
      if (currentText.trim()) {
        silenceTimeout = setTimeout(() => {
          if (!sent && alive.current) {
            try { rec.stop(); } catch {
              // Ignore duplicate stop calls while processing silence.
            }
          }
        }, 1200);
      }
    };

    rec.onend = () => {
      if (silenceTimeout) clearTimeout(silenceTimeout);
      if (sent || !alive.current) return;
      sent = true;

      if (final.trim()) {
        setDebug(`Enviando a Claude: "${final.trim()}"`);
        processInput(final.trim());
      } else {
        setDebug('No se detecto voz, reintentando...');
        setTimeout(() => {
          if (alive.current) startListening();
        }, 200);
      }
    };

    rec.onerror = (e) => {
      if (silenceTimeout) clearTimeout(silenceTimeout);
      setDebug('Mic error: ' + e.error);
      if (sent || !alive.current) return;

      if (e.error === 'no-speech' || e.error === 'aborted') {
        sent = true;
        setTimeout(() => {
          if (alive.current) startListening();
        }, 200);
      }
    };

    try {
      rec.start();
    } catch (e) {
      setDebug('Error iniciando mic: ' + e.message);
      setTimeout(() => {
        if (alive.current) startListening();
      }, 500);
    }
  }

  async function processInput(text) {
    if (!alive.current) return;

    setPhase('thinking');
    setTranscript('');

    const userMsg = { role: 'user', text };
    msgs.current = [...msgs.current, userMsg];
    setCallLog((prev) => [...prev, userMsg]);

    setDebug('Claude pensando...');

    try {
      const response = await chatWithAgent(
        agent.name, agent.type, msgs.current, profile, { voiceMode: true }
      );
      setDebug(`Claude respondio: "${response.slice(0, 50)}..."`);

      if (alive.current) {
        await agentSpeak(response);
      }
    } catch (e) {
      setDebug('Error Claude: ' + e.message);
      if (alive.current) {
        await agentSpeak('Disculpa, tuve un problema. Puedes repetir?');
      }
    }
  }

  // Start call on mount
  useEffect(() => {
    alive.current = true;
    const greeting = `Hola, soy ${agent.name}, tu agente de ventas. En que te puedo ayudar?`;

    const timer = setTimeout(() => {
      agentSpeak(greeting);
    }, 500);

    return () => {
      alive.current = false;
      clearTimeout(timer);
      stopSpeaking();
      try { recRef.current?.stop(); } catch {
        // Ignore teardown errors when the call modal unmounts.
      }
    };
    // This call session is intentionally bootstrapped once when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndCall = () => {
    alive.current = false;
    stopSpeaking();
    try { recRef.current?.stop(); } catch {
      // Ignore teardown errors if the microphone is already closed.
    }
    onClose();
  };

  // Colors by phase
  const colors = {
    starting: 'from-gray-400 to-gray-500',
    listening: 'from-emerald-400 to-emerald-500',
    thinking: 'from-amber-400 to-amber-500',
    speaking: 'from-emerald-400 to-blue-500',
  };

  const labels = {
    starting: 'Conectando...',
    listening: 'Escuchando...',
    thinking: 'Pensando...',
    speaking: 'Hablando...',
  };

  return (
    <RenderProfiler id="VoiceCall">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-inkDark/90 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-sm mx-4">
          <div className="transform-gpu bg-gradient-to-b from-brand-ink to-[#162d54] rounded-3xl p-8 shadow-2xl border border-white/5">

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${colors[phase]} flex items-center justify-center text-white text-5xl font-extrabold shadow-lg transition-all duration-500`}>
                {agent.avatar}
              </div>
              {phase !== 'starting' && (
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors[phase]} opacity-20 animate-ping`} style={{ animationDuration: '2s' }} />
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white">{agent.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{agent.type}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-emerald-400">{fmt(seconds)}</span>
            </div>
          </div>

          {/* Status + content */}
          <div className="bg-white/5 rounded-2xl p-4 mb-4 min-h-[80px]">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${colors[phase]} bg-clip-text text-transparent`}>
                {labels[phase]}
              </span>
              {phase === 'listening' && (
                <div className="flex gap-0.5">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i*80}ms`, height: '12px', animationDuration: '0.5s' }} />
                  ))}
                </div>
              )}
              {phase === 'thinking' && (
                <div className="flex gap-1">
                  {[0,1,2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                  ))}
                </div>
              )}
              {phase === 'speaking' && (
                <div className="flex items-end gap-[3px]">
                  {[0,1,2,3,4,5,6].map((i) => (
                    <div key={i} className="w-[3px] bg-brand-accent rounded-full" style={{ animation: 'waveform 0.8s ease-in-out infinite alternate', animationDelay: `${i*80}ms`, height: '4px' }} />
                  ))}
                </div>
              )}
            </div>

            {phase === 'listening' && (
              <p className="text-sm text-white/80">{transcript || <span className="text-gray-500 italic">Habla ahora...</span>}</p>
            )}
            {phase === 'speaking' && agentText && (
              <p className="text-sm text-brand-accent">{agentText}</p>
            )}
            {phase === 'thinking' && (
              <p className="text-sm text-gray-500 italic">Procesando...</p>
            )}
          </div>

          {/* Debug line */}
          <div className="bg-black/30 rounded-xl px-3 py-1.5 mb-4">
            <p className="text-[10px] font-mono text-gray-500 truncate">{debug}</p>
          </div>

          {/* Call log */}
          {callLog.length > 1 && (
            <div className="bg-white/5 rounded-2xl p-3 mb-4 max-h-[100px] overflow-y-auto">
              {callLog.slice(-4).map((msg, i) => (
                <div key={i} className="flex gap-2 items-start mb-1 last:mb-0">
                  <span className={`text-[10px] font-bold uppercase ${msg.role === 'user' ? 'text-emerald-400' : 'text-brand-accent'}`}>
                    {msg.role === 'user' ? 'Tu' : 'Carlos'}:
                  </span>
                  <span className="text-[11px] text-gray-400 line-clamp-1">{msg.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hang up */}
          <div className="flex justify-center">
            <button onClick={handleEndCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.06-1.06M2.757 18.364a9 9 0 001.06-1.06M3.34 7.636a9 9 0 00-.581 4.364m.581-4.364L2.1 5.636m16.8 0l-1.24 2M12 12h.01" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">Toca para colgar</p>
          </div>
        </div>

        <style>{`
        @keyframes waveform {
          0% { height: 4px; }
          100% { height: 18px; }
        }
        `}</style>
      </div>
    </RenderProfiler>
  );
}
