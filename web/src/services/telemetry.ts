import { ServiceCallLog, ServiceHealth, ServiceName } from '../types';

type TelemetryListener = (logs: ServiceCallLog[]) => void;

class MonolithTelemetryManager {
  private logs: ServiceCallLog[] = [];
  private listeners: Set<TelemetryListener> = new Set();
  private maxLogs: number = 80;

  public getServicesHealth(): ServiceHealth[] {
    return [
      {
        name: 'auth',
        displayName: 'Auth Service',
        status: 'healthy',
        version: 'v1.4.2',
        endpointsCount: 5,
        description: 'Autenticación JWT, control de sesiones, emisión y verificación de tokens.'
      },
      {
        name: 'users',
        displayName: 'Users Service',
        status: 'healthy',
        version: 'v2.1.0',
        endpointsCount: 6,
        description: 'Perfiles de usuario, libretas de direcciones y configuración de clientes.'
      },
      {
        name: 'products',
        displayName: 'Products Service',
        status: 'healthy',
        version: 'v3.0.1',
        endpointsCount: 8,
        description: 'Catálogo de productos, control de stock en tiempo real, categorías y búsqueda.'
      },
      {
        name: 'orders',
        displayName: 'Orders Service',
        status: 'healthy',
        version: 'v2.3.0',
        endpointsCount: 7,
        description: 'Gestión de carritos, creación y ciclo de vida de órdenes, tracking y estados.'
      },
      {
        name: 'payments',
        displayName: 'Payments Service',
        status: 'healthy',
        version: 'v1.8.4',
        endpointsCount: 4,
        description: 'Procesamiento de pagos, pasarelas de tarjetas, webhooks y generación de comprobantes.'
      }
    ];
  }

  public log(logEntry: Omit<ServiceCallLog, 'id' | 'timestamp'>): ServiceCallLog {
    const fullEntry: ServiceCallLog = {
      ...logEntry,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };

    this.logs = [fullEntry, ...this.logs].slice(0, this.maxLogs);
    this.notify();
    return fullEntry;
  }

  public getLogs(): ServiceCallLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.notify();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = this.getLogs();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('Error in telemetry listener', err);
      }
    });
  }
}

export const telemetry = new MonolithTelemetryManager();
