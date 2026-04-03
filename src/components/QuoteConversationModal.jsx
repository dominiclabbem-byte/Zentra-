import { useEffect, useState } from 'react';

function MessageBubble({ message, isOwnMessage }) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isOwnMessage
            ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white'
            : 'bg-white border border-gray-100 text-[#0D1F3C]'
        }`}
      >
        <div className={`text-[11px] font-semibold uppercase tracking-wide ${isOwnMessage ? 'text-white/75' : 'text-gray-400'}`}>
          {message.senderName}
        </div>
        <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap">{message.body}</p>
        <div className={`text-[11px] mt-2 ${isOwnMessage ? 'text-white/75' : 'text-gray-400'}`}>
          {message.createdAtLabel}
        </div>
      </div>
    </div>
  );
}

export default function QuoteConversationModal({
  isOpen,
  onClose,
  conversation,
  messages,
  currentUserId,
  isLoading,
  isSending,
  onSendMessage,
  onRefresh,
}) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDraft('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !onRefresh) return undefined;

    const interval = window.setInterval(() => {
      onRefresh();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  const participantName = currentUserId === conversation?.buyerUserId
    ? conversation?.supplier?.companyName
    : conversation?.buyer?.companyName;
  const isClosed = conversation?.isClosed;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.trim() || isSending || isClosed) return;

    await onSendMessage(draft.trim());
    setDraft('');
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-[#0D1F3C]/55 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl my-8 bg-[#f8fafc] rounded-2xl shadow-2xl shadow-[#0D1F3C]/20 overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-[#0D1F3C] via-[#1a3260] to-[#0D1F3C] px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pr-10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2ECAD5]">Solicitud de Cotización</div>
            <h2 className="text-xl font-extrabold mt-2">{conversation?.quote?.productName ?? 'Cotizacion'}</h2>
            <p className="text-sm text-white/75 mt-1">
              {participantName ?? 'Participante'} / {conversation?.quote?.quantityLabel ?? 'Sin cantidad'} / Entrega {conversation?.quote?.deliveryDateLabel ?? 'Sin fecha'}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className={`font-semibold px-3 py-1 rounded-full ${isClosed ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {isClosed ? 'Cerrada' : 'Activa'}
            </span>
            <span>{conversation?.quote?.categoryName ?? 'Sin categoria'}</span>
            {conversation?.lastMessageAt && <span>Ultimo mensaje {conversation.lastMessageAtLabel}</span>}
          </div>
          {isClosed && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Esta conversacion quedo en solo lectura porque la Solicitud de Cotización ya fue cerrada o cancelada.
            </div>
          )}
        </div>

        <div className="px-6 py-5 bg-[#f8fafc]">
          {isLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
              Cargando conversacion...
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-[#eef4f7] p-4 space-y-3 max-h-[52vh] overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.senderUserId === currentUserId}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
                  Aun no hay mensajes. Usa este canal para aclarar detalles de la cotizacion.
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 border-t border-gray-100 bg-white">
          <label htmlFor="quote-conversation-message" className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje
          </label>
          <textarea
            id="quote-conversation-message"
            rows={3}
            value={draft}
            disabled={isSending || isClosed}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isClosed ? 'La conversacion esta cerrada.' : 'Escribe un mensaje sobre esta Solicitud de Cotización...'}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSending || isClosed || !draft.trim()}
              className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
