'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Chat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'practica';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!savedToken || !savedUser) {
      router.push('/');
      return;
    }

    setToken(savedToken);
    setUser(JSON.parse(savedUser));

    if (mode === 'vendedor' && !JSON.parse(savedUser).modeUnlocked) {
      router.push('/chat?mode=practica');
    }
  }, [router, mode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !token) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
          mode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Error al enviar mensaje');
        return;
      }

      setConversationId(data.conversationId);
      setMessages([
        ...messages,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.response }
      ]);
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!token || !user) return <div>Cargando...</div>;

  return (
        <div className="h-screen flex flex-col bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Sala de ventas</h1>
          <p className="text-sm text-slate-400">
            Modo: <span className="font-semibold text-amber-500 capitalize">{mode}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300">{user.name}</span>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-slate-400">
            <div>
              <p className="text-lg mb-2">
                {mode === 'practica' 
                  ?