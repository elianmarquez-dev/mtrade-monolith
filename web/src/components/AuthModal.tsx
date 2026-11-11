import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AuthModal: React.FC = () => {
  const { t } = useLanguage();
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    login,
    register,
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
          setError(t('Ingresa un correo electrónico.'));
          return;
        }
        await login({ email, password });
      } else {
        if (!email || !password) {
          setError(t('Completa tu correo y contraseña.'));
          return;
        }
        await register({ email, password, firstName, lastName });
      }
    } catch (err: any) {
      setError(err.message || t('No se pudo completar el inicio de sesión.'));
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
              {authModalMode === 'login' ? t('Iniciar sesión') : t('Crear cuenta')}
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
            {t('Ingresar')}
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
            {t('Registrarse')}
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
                  <label className="block font-semibold text-stone-700 mb-1">{t('Nombre:')}</label>
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
                  <label className="block font-semibold text-stone-700 mb-1">{t('Apellido:')}</label>
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
              <label className="block font-semibold text-stone-700 mb-1">{t('Correo Electrónico:')}</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('tu@correo.com')}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-stone-900 focus:bg-white focus:outline-none"
                  required
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">{t('Contraseña:')}</label>
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
                {authModalMode === 'login' ? t('Iniciar Sesión') : t('Crear Cuenta')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
