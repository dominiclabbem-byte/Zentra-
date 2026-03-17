import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium ${colors[type]} animate-bounce`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <span className="text-xl">{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}
