import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getQuoteConversationMessages,
  getQuoteConversationsForUser,
  markQuoteConversationRead,
  sendQuoteConversationMessage,
} from '../services/database';
import { mapQuoteConversationMessageRecord, mapQuoteConversationRecord } from '../lib/conversationAdapters';

export default function ChatWidget() {
  const { currentUser, refreshNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0] ?? null,
    [activeConversationId, conversations],
  );

  const groupedConversations = useMemo(() => {
    const groups = new Map();
    conversations.forEach((conversation) => {
      const other = currentUser?.id === conversation.buyerUserId ? conversation.supplier : conversation.buyer;
      const key = other?.id ?? 'unknown';
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          name: other?.companyName ?? 'Contacto',
          city: other?.city ?? '',
          conversations: [],
        });
      }
      groups.get(key).conversations.push(conversation);
    });
    return [...groups.values()];
  }, [conversations, currentUser?.id]);

  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return [];
    const rows = await getQuoteConversationsForUser(currentUser.id);
    const mapped = rows.map(mapQuoteConversationRecord).filter(Boolean);
    setConversations(mapped);
    setActiveConversationId((current) => current || mapped[0]?.id || '');
    return mapped;
  }, [currentUser?.id]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId || !currentUser?.id) return;
    setIsLoading(true);
    try {
      const rows = await getQuoteConversationMessages(conversationId);
      setMessages(rows.map(mapQuoteConversationMessageRecord).filter(Boolean));
      await markQuoteConversationRead({ conversationId, userId: currentUser.id });
      refreshNotifications?.(currentUser.id);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, refreshNotifications]);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return undefined;
    loadConversations();
    const interval = window.setInterval(() => loadConversations(), 30000);
    return () => window.clearInterval(interval);
  }, [currentUser?.id, isOpen, loadConversations]);

  useEffect(() => {
    if (!isOpen || !activeConversation?.id) return undefined;
    loadMessages(activeConversation.id);
    const interval = window.setInterval(() => loadMessages(activeConversation.id), 12000);
    return () => window.clearInterval(interval);
  }, [activeConversation?.id, isOpen, loadMessages]);

  if (!currentUser?.id) return null;

  const unreadCount = conversations.filter((conversation) => {
    const readAt = currentUser.id === conversation.buyerUserId
      ? conversation.buyerLastReadAt
      : conversation.supplierLastReadAt;
    if (!conversation.lastMessageAt) return false;
    if (!readAt) return true;
    return new Date(conversation.lastMessageAt) > new Date(readAt);
  }).length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeConversation?.id || !draft.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendQuoteConversationMessage({
        conversationId: activeConversation.id,
        senderUserId: currentUser.id,
        body: draft.trim(),
      });
      setDraft('');
      await Promise.all([
        loadMessages(activeConversation.id),
        loadConversations(),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 text-brand-ink shadow-2xl shadow-emerald-400/25 transition hover:scale-[1.03]"
        aria-label="Abrir chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[620px] max-h-[calc(100vh-7rem)] w-[min(920px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-brand-inkDark text-white shadow-2xl shadow-black/35">
          <aside className="hidden w-72 border-r border-white/10 bg-white/[0.03] md:block">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <div className="text-sm font-black">Mensajes</div>
                <div className="text-xs text-slate-500">Contactos y cotizaciones</div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[560px] overflow-y-auto p-3">
              {groupedConversations.length > 0 ? groupedConversations.map((group) => (
                <div key={group.id} className="mb-3">
                  <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{group.name}</div>
                  <div className="space-y-1">
                    {group.conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setActiveConversationId(conversation.id)}
                        className={`w-full rounded-xl px-3 py-2 text-left transition ${activeConversation?.id === conversation.id ? 'bg-brand-accent/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                      >
                        <div className="truncate text-xs font-bold">{conversation.quote?.productName ?? 'Cotizacion'}</div>
                        <div className="mt-0.5 truncate text-[11px] text-slate-500">{conversation.quote?.quantityLabel ?? ''}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
                  Aun no tienes conversaciones.
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-black">{activeConversation?.quote?.productName ?? 'Chat de cotizacion'}</div>
                <div className="truncate text-xs text-slate-500">
                  {activeConversation ? `${activeConversation.buyer?.companyName ?? 'Comprador'} / ${activeConversation.supplier?.companyName ?? 'Proveedor'}` : 'Selecciona una conversacion'}
                </div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 md:hidden">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-brand-canvas p-4 text-brand-ink">
              {isLoading ? (
                <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">Cargando mensajes...</div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isOwn = message.senderUserId === currentUser.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isOwn ? 'bg-brand-ink text-white' : 'bg-white text-brand-ink'}`}>
                          <div className={`text-[10px] font-bold uppercase tracking-wide ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>{message.senderName}</div>
                          <div className="mt-1 whitespace-pre-wrap leading-6">{message.body}</div>
                          <div className={`mt-2 text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>{message.createdAtLabel}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  No hay mensajes en esta cotizacion.
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 bg-white p-4">
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!activeConversation || activeConversation.isClosed || isSending}
                  placeholder={activeConversation?.isClosed ? 'Conversacion cerrada.' : 'Escribe un mensaje...'}
                  className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 disabled:bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || !activeConversation || activeConversation.isClosed || isSending}
                  className="grid h-12 w-12 place-items-center rounded-xl bg-brand-ink text-brand-accent transition hover:bg-brand-inkLight disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Enviar mensaje"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
