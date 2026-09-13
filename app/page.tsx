'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
        try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: isRegister ? name : undefined, register: isRegister })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/chat?mode=practica');
    } catch (err) {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-2">Sala de ventas</h1>
        <p className="text-slate-400 mb-8">Simulador de practica</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
            </div>
          )}
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required />
          {error && <div className="bg-red-500 text-white px-3 py-2 rounded text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded">
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
                <p className="mt-6 text-center text-slate-400 text-sm">
          {isRegister ? 'Ya tenias cuenta?' : 'No tenias cuenta?'}
          <button onClick={() => setIsRegister(!isRegister)} className="text-amber-500 ml-1 font-semibold">
            {isRegister ? 'Entrar' : 'Registrarse'}
          </button>
        </p>
      </div>
    </div>
  );
}