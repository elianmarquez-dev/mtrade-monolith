import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
    loginAsDemoUser,
    loginAsDemoAdmin,
    isLoading
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (authModalMode === 'login') {
        if (!email) {
          setError('Ingresa un correo electrónico.');
          return;
        }
        await login({ email, password });
      } else {
        if (!email || !password) {
          setError('Completa tu correo y contraseña.');
          return;
        }
        await register({ email, password, firstName, lastName });
      }
    } catch (err: any) {
      setError(err.message || 'Error en Auth Service');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-stone-900">
              {authModalMode === 'login' ? 'Iniciar Sesión (Auth Service)' : 'Crear Cuenta (Auth Service)'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className={`flex-1 py-3 text-center transition ${
              authModalMode === 'login'
                ? 'border-b-2 border-stone-900 text-stone-900 font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className={`flex-1 py-3 text-center transition ${
              authModalMode === 'register'
                ? 'border-b-2 border-stone-900 text-stone-900 font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Registrarse
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {authModalMode === 'register' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nombre:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Sofia"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                    />
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Apellido:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Morales"
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                    />
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Correo Electrónico:</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                  required
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contraseña:</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>


            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition mt-2 cursor-pointer"
            >
              <span>
                {authModalMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-5 pt-4 border-t border-stone-200 text-xs">
            <span className="block text-stone-500 font-semibold text-[11px] mb-2 text-center">
              ACCESO RÁPIDO CON CUENTAS DEMO:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loginAsDemoUser}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-left transition"
              >
                <span className="block font-bold text-stone-900">Camila R.</span>
                <span className="text-[10px] text-stone-500">Rol: Cliente</span>
              </button>
              <button
                type="button"
                onClick={loginAsDemoAdmin}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-left transition"
              >
                <span className="block font-bold text-stone-900">Admin</span>
                <span className="text-[10px] text-stone-500">Rol: Administrador</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
