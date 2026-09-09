import React, { useState } from 'react';
import {
  X,
  Layers,
  Activity,
  Terminal,
  Server,
  Filter,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Cpu,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useMonolith } from '../context/MonolithContext';
import { ServiceCallLog, ServiceName } from '../types';

export const MonolithInspector: React.FC = () => {
  const {
    isInspectorOpen,
    closeInspector,
    logs,
    servicesHealth,
    clearLogs,
    selectedServiceFilter,
    setSelectedServiceFilter
  } = useMonolith();

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stream' | 'architecture'>('stream');

  if (!isInspectorOpen) return null;

  const filteredLogs = selectedServiceFilter === 'all'
    ? logs
    : logs.filter((l) => l.service === selectedServiceFilter);

  const getServiceColor = (service: ServiceName) => {
    switch (service) {
      case 'auth':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'users':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'products':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'orders':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'payments':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-sky-50 text-sky-700 font-mono font-bold';
      case 'POST':
        return 'bg-emerald-50 text-emerald-700 font-mono font-bold';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-50 text-amber-700 font-mono font-bold';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 font-mono font-bold';
      default:
        return 'bg-stone-50 text-stone-700 font-mono font-bold';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 bg-stone-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">
                  Monolito Modular Backend Inspector
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  5/5 Servicios Activos
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Supervisa las llamadas HTTP y límites entre módulos (auth, users, products, orders, payments)
              </p>
            </div>
          </div>

          <button
            onClick={closeInspector}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-stone-900 text-stone-400 text-xs font-semibold px-4 border-b border-stone-800">
          <button
            onClick={() => setActiveTab('stream')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'stream'
                ? 'border-emerald-400 text-white font-bold'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Feed de Solicitudes ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'architecture'
                ? 'border-emerald-400 text-white font-bold'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mapa de Arquitectura (5 Módulos)</span>
          </button>
        </div>

        {/* TAB 1: ARCHITECTURE MAP */}
        {activeTab === 'architecture' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50 text-xs">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <h3 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Estructura del Monolito Modular</span>
              </h3>
              <p className="text-stone-500 leading-relaxed">
                A diferencia de los microservicios distribuidos, el <strong>monolito modular</strong> ejecuta los 5 dominios de negocio en una sola base de código desplegable, manteniendo fronteras lógicas y modelos de dominio estrictamente desacoplados.
              </p>
            </div>

            {/* Services Cards */}
            <div className="space-y-3">
              {servicesHealth.map((srv) => (
                <div
                  key={srv.name}
                  className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getServiceColor(srv.name)}`}>
                        {srv.displayName}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">{srv.version}</span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Operativo
                      </span>
                    </div>
                    <p className="text-stone-600 text-xs">{srv.description}</p>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {srv.endpointsCount} endpoints mapeados • Prefijo: /api/{srv.name}/*
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedServiceFilter(srv.name);
                      setActiveTab('stream');
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md shrink-0 ml-2"
                  >
                    Ver Logs
                  </button>
                </div>
              ))}
            </div>

            {/* Visual Workflow Diagram */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="font-bold text-stone-900 block mb-2">Flujo de Comunicación Típico:</span>
              <div className="font-mono text-[11px] text-stone-700 space-y-1.5 bg-stone-100 p-3 rounded-lg">
                <p className="text-purple-700">1. Client ➔ [auth] : POST /api/auth/login (JWT emitido)</p>
                <p className="text-emerald-700">2. Client ➔ [products] : GET /api/products (Catálogo y stock)</p>
                <p className="text-blue-700">3. Client ➔ [users] : GET /api/users/:id/addresses (Dirección)</p>
                <p className="text-amber-700">4. Client ➔ [orders] : POST /api/orders (Creación orden)</p>
                <p className="text-rose-700">5. Client ➔ [payments] : POST /api/payments/charge (Cobro orden)</p>
                <p className="text-emerald-700">6. Monolith ➔ [products] : Deducción de stock</p>
                <p className="text-amber-700">7. Monolith ➔ [orders] : Actualización de estado a 'paid'</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TELEMETRY STREAM */}
        {activeTab === 'stream' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="p-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-stone-500" />
                <button
                  onClick={() => setSelectedServiceFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    selectedServiceFilter === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Todos ({logs.length})
                </button>
                {(['auth', 'users', 'products', 'orders', 'payments'] as ServiceName[]).map((srv) => (
                  <button
                    key={srv}
                    onClick={() => setSelectedServiceFilter(srv)}
                    className={`px-2 py-1 rounded-md font-semibold capitalize transition ${
                      selectedServiceFilter === srv
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>

              {logs.length > 0 && (
                <button
                  onClick={clearLogs}
                  className="p-1.5 text-stone-400 hover:text-rose-600 transition"
                  title="Limpiar logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-stone-100 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="py-16 text-center text-stone-400">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-sans text-xs">No hay llamadas registradas para este filtro.</p>
                  <p className="font-sans text-[11px] text-stone-400 mt-0.5">
                    Interactúa con la tienda (añade productos, navega, haz checkout) para ver tráfico en tiempo real.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div
                      key={log.id}
                      className="pt-2 first:pt-0 pb-1 cursor-pointer hover:bg-stone-50/80 rounded-lg p-1.5 transition"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${getMethodBadge(log.method)}`}>
                            {log.method}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getServiceColor(log.service)}`}>
                            {log.service}
                          </span>
                          <span className="font-semibold text-stone-900 truncate max-w-[200px] sm:max-w-xs">
                            {log.endpoint}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">
                            {log.status}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {log.durationMs}ms
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Payload Viewer */}
                      {isExpanded && (
                        <div className="mt-2.5 p-3 bg-stone-900 text-stone-200 rounded-lg text-[11px] space-y-2 animate-in fade-in duration-150">
                          <div className="flex justify-between text-stone-400 text-[10px] border-b border-stone-800 pb-1">
                            <span>ID: {log.id}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>

                          {log.requestPayload && (
                            <div>
                              <span className="text-amber-400 font-semibold text-[10px] block mb-0.5">
                                Payload de Solicitud (Request):
                              </span>
                              <pre className="overflow-x-auto text-stone-300 bg-stone-950 p-2 rounded text-[10px]">
                                {JSON.stringify(log.requestPayload, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.responsePayload && (
                            <div>
                              <span className="text-emerald-400 font-semibold text-[10px] block mb-0.5">
                                Respuesta del Módulo (Response):
                              </span>
                              <pre className="overflow-x-auto text-stone-300 bg-stone-950 p-2 rounded text-[10px]">
                                {JSON.stringify(log.responsePayload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
