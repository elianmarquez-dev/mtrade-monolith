import React, { useState } from 'react';
import { X, User, MapPin, Key, Plus, Check, ShieldCheck, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services';
import { UserAddress } from '../types';

export const UserProfileModal: React.FC = () => {
  const { session, profile, isProfileModalOpen, closeProfileModal, refreshProfile, loginAsDemoUser, loginAsDemoAdmin } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(profile?.name || session?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '+34 612 345 678');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const [newAddr, setNewAddr] = useState<Omit<UserAddress, 'id'>>({
    label: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España',
    isDefault: false
  });

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isProfileModalOpen || !session) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersService.updateProfile(session.id, { name, phone });
      await refreshProfile();
      setIsEditingProfile(false);
      setStatusMsg('Perfil actualizado correctamente en Users Service.');
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.street || !newAddr.city) return;
    try {
      await usersService.addAddress(session.id, newAddr);
      await refreshProfile();
      setIsAddingAddress(false);
      setNewAddr({
        label: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'España',
        isDefault: false
      });
      setStatusMsg('Nueva dirección registrada en Users Service.');
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-stone-900" />
            <h2 className="text-base font-bold text-stone-900">
              Mi Perfil y Cuenta (Users Service)
            </h2>
          </div>
          <button
            onClick={closeProfileModal}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className="mx-6 mt-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* User basic info card */}
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center gap-3">
              {session.avatarUrl ? (
                <img
                  src={session.avatarUrl}
                  alt={session.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-stone-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">
                  {session.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-stone-900">{profile?.name || session.name}</h3>
                <p className="text-xs text-stone-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {session.email}
                </p>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {profile?.phone || '+34 612 345 678'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Rol: {session.role}
              </span>
              <div className="mt-2">
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs text-stone-600 hover:text-stone-900 font-medium underline"
                >
                  {isEditingProfile ? 'Cancelar' : 'Editar Datos'}
                </button>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditingProfile && (
            <form onSubmit={handleUpdateProfile} className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Teléfono Móvil:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-900"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition"
              >
                Guardar Cambios (PUT /api/users/{session.id})
              </button>
            </form>
          )}

          {/* Addresses Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Libreta de Direcciones (Users Service)</span>
              </h4>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingAddress ? 'Cerrar Formulario' : 'Agregar Dirección'}</span>
              </button>
            </div>

            {isAddingAddress && (
              <form onSubmit={handleAddAddress} className="mb-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Etiqueta:</label>
                    <input
                      type="text"
                      placeholder="Ej: Apartamento Playa"
                      value={newAddr.label}
                      onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Ciudad:</label>
                    <input
                      type="text"
                      placeholder="Valencia"
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Dirección / Calle:</label>
                  <input
                    type="text"
                    placeholder="Calle Marina 45, Puerta 2"
                    value={newAddr.street}
                    onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Código Postal:</label>
                    <input
                      type="text"
                      placeholder="46001"
                      value={newAddr.postalCode}
                      onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">País:</label>
                    <input
                      type="text"
                      value={newAddr.country}
                      onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition"
                >
                  Guardar Dirección (POST /api/users/addresses)
                </button>
              </form>
            )}

            <div className="space-y-2">
              {profile?.addresses && profile.addresses.length > 0 ? (
                profile.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3 bg-white rounded-xl border border-stone-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-stone-500 mt-0.5">
                        {addr.street} — {addr.city} ({addr.postalCode}), {addr.country}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400">No hay direcciones registradas.</p>
              )}
            </div>
          </div>

          {/* Auth Token Details */}
          <div className="p-3.5 bg-stone-900 text-stone-300 rounded-xl text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Key className="w-3.5 h-3.5" />
                Auth Service JWT Token:
              </span>
              <span>Bearer 256-bit</span>
            </div>
            <p className="break-all text-[10px] text-stone-400 bg-stone-800/80 p-2 rounded">
              {session.token}
            </p>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">Alternar cuenta de prueba:</span>
            <div className="flex gap-2">
              <button
                onClick={loginAsDemoUser}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-semibold transition text-[11px]"
              >
                Cliente (Camila)
              </button>
              <button
                onClick={loginAsDemoAdmin}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-semibold transition text-[11px]"
              >
                Admin (Plataforma)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
