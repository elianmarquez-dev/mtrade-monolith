import { Product, UserProfile, UserSession } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    title: 'Auriculares Inalámbricos Pro ANC',
    description: 'Cancelación activa de ruido híbrida de 40dB, audio de alta resolución y 35 horas de autonomía.',
    price: 149.99,
    compareAtPrice: 199.99,
    category: 'Electrónica',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 142,
    stock: 18,
    sku: 'AUDIO-ANC-001',
    isFeatured: true,
    tags: ['Bluetooth', 'ANC', 'Batería 35h']
  },
  {
    id: 'prod-002',
    title: 'Teclado Mecánico RGB 75% Hot-Swap',
    description: 'Switches lineales lubricados de fábrica, chasis de aluminio anodizado y conectividad tri-modo.',
    price: 119.50,
    compareAtPrice: 139.00,
    category: 'Computación',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 88,
    stock: 12,
    sku: 'KEYB-75-LIN',
    isFeatured: true,
    tags: ['Mecánico', 'RGB', 'Wireless']
  },
  {
    id: 'prod-003',
    title: 'Smartwatch Titan Edge S2',
    description: 'Pantalla AMOLED de 1.43", sensor óptico biométrico de pulso y SpO2, resistencia al agua 5ATM.',
    price: 189.00,
    compareAtPrice: 229.00,
    category: 'Electrónica',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewsCount: 204,
    stock: 25,
    sku: 'WATCH-TITAN-S2',
    isFeatured: true,
    tags: ['GPS', 'Cardíaco', '5ATM']
  },
  {
    id: 'prod-004',
    title: 'Mochila Urbana Impermeable 24L',
    description: 'Compartimento acolchado para laptop de 16", puerto de carga USB integrado y tela Cordura repelente al agua.',
    price: 68.00,
    category: 'Accesorios',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    reviewsCount: 75,
    stock: 30,
    sku: 'BAG-URB-24L',
    isFeatured: false,
    tags: ['Laptop 16"', 'Impermeable', 'Viajes']
  },
  {
    id: 'prod-005',
    title: 'Cámara Mirrorless 4K CineLens',
    description: 'Sensor APS-C de 26MP, grabación de video en 4K60p sin recorte y estabilización óptica de 5 ejes en cuerpo.',
    price: 849.00,
    compareAtPrice: 949.00,
    category: 'Fotografía',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 63,
    stock: 5,
    sku: 'CAM-4K-CINE',
    isFeatured: true,
    tags: ['4K60p', 'IBIS', '26MP']
  },
  {
    id: 'prod-006',
    title: 'Lámpara de Escritorio LED Minimalista',
    description: 'Control táctil de temperatura de color (2700K - 6500K), brazo articulado de aluminio y base inalámbrica Qi de 15W.',
    price: 45.99,
    category: 'Hogar y Oficina',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    reviewsCount: 52,
    stock: 40,
    sku: 'LAMP-LED-QI',
    isFeatured: false,
    tags: ['LED', 'Carga Qi', 'Touch']
  },
  {
    id: 'prod-007',
    title: 'Botella Térmica de Acero Inoxidable 750ml',
    description: 'Aislamiento de vacío de doble pared: conserva bebidas frías por 24h o calientes por 12h. Libre de BPA.',
    price: 24.50,
    category: 'Accesorios',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewsCount: 110,
    stock: 50,
    sku: 'BOTTLE-SS-750',
    isFeatured: false,
    tags: ['Termo', 'Libre BPA', 'Eco']
  },
  {
    id: 'prod-008',
    title: 'Mouse Ergonómico Inalámbrico Precision Flow',
    description: 'Sensor óptico de 8000 DPI con seguimiento sobre cristal, rueda electromagnética MagSpeed y conexión para 3 dispositivos.',
    price: 89.90,
    compareAtPrice: 105.00,
    category: 'Computación',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewsCount: 180,
    stock: 15,
    sku: 'MOUSE-PREC-01',
    isFeatured: true,
    tags: ['Ergonómico', 'Multi-dispositivo', '8000 DPI']
  }
];

export const DEMO_USER: UserProfile = {
  id: 'usr-101',
  name: 'Camila Rodriguez',
  email: 'camila.rodriguez@example.com',
  phone: '+34 612 345 678',
  role: 'customer',
  preferredCurrency: 'USD',
  createdAt: '2025-01-15T10:00:00.000Z',
  addresses: [
    {
      id: 'addr-01',
      label: 'Dirección Principal (Casa)',
      street: 'Av. Libertador 4520, Piso 4B',
      city: 'Madrid',
      state: 'Madrid',
      postalCode: '28001',
      country: 'España',
      isDefault: true
    },
    {
      id: 'addr-02',
      label: 'Oficina / Coworking',
      street: 'Paseo de la Castellana 110, Planta 3',
      city: 'Madrid',
      state: 'Madrid',
      postalCode: '28046',
      country: 'España',
      isDefault: false
    }
  ]
};

export const DEMO_ADMIN: UserProfile = {
  id: 'usr-admin-01',
  name: 'Administrador de Plataforma',
  email: 'admin@ecommerce.modular',
  phone: '+34 600 000 001',
  role: 'admin',
  preferredCurrency: 'USD',
  createdAt: '2024-11-01T08:00:00.000Z',
  addresses: [
    {
      id: 'addr-admin-01',
      label: 'Sede Corporativa Monolito',
      street: 'Calle de la Innovación 77',
      city: 'Barcelona',
      state: 'Cataluña',
      postalCode: '08005',
      country: 'España',
      isDefault: true
    }
  ]
};
