import { useState, useRef, useEffect } from 'react';

const MOCK_MESSAGES = {
  1: [
    { id: 1, from: 'contact', text: 'Hola! Queria consultarles sobre disponibilidad de harina extra fina para la proxima semana.', time: '09:14' },
    { id: 2, from: 'me', text: 'Claro! Tenemos stock disponible. Cuanta cantidad necesitas?', time: '09:17' },
    { id: 3, from: 'contact', text: 'Necesitamos unos 800 kg. Podrian cotizarnos con despacho a Nunoa?', time: '09:20' },
    { id: 4, from: 'me', text: 'Por supuesto. Te enviamos la cotizacion formal por el sistema ahora mismo.', time: '09:22' },
    { id: 5, from: 'contact', text: 'Perfecto, muchas gracias!', time: '09:23' },
  ],
  2: [
    { id: 1, from: 'contact', text: 'Buenos dias. Estamos evaluando proveedores de aceite de oliva para nuestro restaurante.', time: '11:05' },
    { id: 2, from: 'me', text: 'Buenos dias! Con gusto. Trabajamos con aceite extra virgen primera prensada en frio. Les puedo enviar ficha tecnica?', time: '11:08' },
    { id: 3, from: 'contact', text: 'Si, por favor. Y tambien nos interesa el precio por volumen.', time: '11:10' },
  ],
  3: [
    { id: 1, from: 'contact', text: 'Hola, cotizamos pechuga de pollo la semana pasada. Cuando podrian entregar?', time: '15:30' },
    { id: 2, from: 'me', text: 'Tenemos despacho a Concepcion los martes y viernes. Esta semana podria ser el viernes.', time: '15:35' },
  ],
};

export default function ZChat({ contacts, userLabel }) {
  const [selectedContact, setSelectedContact] = useState(contacts[0] || null);
  const [conversations, setConversations] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState({ 1: 0, 2: 1, 3: 2 });
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const messages = selectedContact ? (conversations[selectedContact.id] || []) : [];

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setUnread((prev) => ({ ...prev, [contact.id]: 0 }));
    inputRef.current?.focus();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedContact) return;
    const now = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const newMsg = { id: Date.now(), from: 'me', text: input.trim(), time: now };
    setConversations((prev) => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg],
    }));
    setInput('');
  };

  const getLastMessage = (contactId) => {
    const msgs = conversations[contactId];
    if (!msgs || msgs.length === 0) return 'Sin mensajes aun';
    return msgs[msgs.length - 1].text;
  };

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium animate-fade-in" style={{ height: '620px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Z Chat logo mark */}
          <div className="w-9 h-9 bg-[#2ECAD5] rounded-xl flex items-center justify-center shadow-lg shadow-[#2ECAD5]/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-extrabold text-base tracking-tight">Z Chat</h2>
            <p className="text-[#2ECAD5] text-xs font-medium">{userLabel}</p>
          </div>
        </div>
        {totalUnread > 0 && (
          <span className="bg-[#2ECAD5] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            {totalUnread} nuevos
          </span>
        )}
      </div>

      <div className="flex h-[calc(100%-65px)]">
        {/* Contacts sidebar */}
        <div className="w-64 border-r border-gray-100 flex flex-col bg-[#f8fafc]">
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#2ECAD5] transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id;
              const unreadCount = unread[contact.id] || 0;
              const lastMsg = getLastMessage(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`w-full text-left px-3 py-3 flex items-start gap-2.5 transition-all border-b border-gray-50 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#2ECAD5]/10 to-transparent border-l-2 border-l-[#2ECAD5]'
                      : 'hover:bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#2ECAD5] to-[#0D1F3C]'
                      : 'bg-gradient-to-br from-emerald-400 to-blue-500'
                  }`}>
                    {contact.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#0D1F3C]' : 'text-gray-700'}`}>
                        {contact.name}
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-[#2ECAD5] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{lastMsg}</p>
                    <p className="text-[9px] text-gray-300 mt-0.5">{contact.type || contact.city}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-xs font-extrabold">
                  {selectedContact.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0D1F3C]">{selectedContact.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] text-gray-400">{selectedContact.type || selectedContact.city}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f8fafc]">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-14 h-14 bg-[#2ECAD5]/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-400">Inicia la conversacion</p>
                    <p className="text-xs text-gray-300">Escribe tu primer mensaje a {selectedContact.name}</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    {msg.from === 'contact' && (
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-[9px] font-extrabold shrink-0 mr-2 mt-0.5">
                        {selectedContact.initials.slice(0, 1)}
                      </div>
                    )}
                    <div className={`max-w-[72%] ${msg.from === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.from === 'me'
                          ? 'bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] text-white rounded-br-sm'
                          : 'bg-white text-[#0D1F3C] border border-gray-100 shadow-sm rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-300 px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Escribe a ${selectedContact.name}...`}
                  className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-gradient-to-br from-[#2ECAD5] to-[#1BA8B2] rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg hover:shadow-[#2ECAD5]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className="w-16 h-16 bg-[#2ECAD5]/10 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[#0D1F3C]">Z Chat</p>
                <p className="text-sm text-gray-400 mt-1">Selecciona un contacto para empezar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
