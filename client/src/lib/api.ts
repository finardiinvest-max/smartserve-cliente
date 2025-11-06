// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Helper Functions
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Settings API
export async function getSettings() {
  return fetchAPI('/settings');
}

// Products API
export async function getProducts(params?: { categoria?: string; disponivel?: boolean }) {
  const query = new URLSearchParams();
  if (params?.categoria) query.append('categoria', params.categoria);
  if (params?.disponivel !== undefined) query.append('disponivel', String(params.disponivel));
  
  const queryString = query.toString();
  return fetchAPI(`/products${queryString ? `?${queryString}` : ''}`);
}

export async function getProduct(id: string) {
  return fetchAPI(`/products/${id}`);
}

// Orders API
export async function createOrder(orderData: {
  cliente: { nome: string; telefone: string };
  itens: Array<{ produto: string; quantidade: number }>;
  formaPagamento: string;
  observacoes?: string;
}) {
  return fetchAPI('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function getOrderByNumber(numero: string) {
  return fetchAPI(`/orders/numero/${numero}`);
}

export async function confirmPixPayment(orderId: string) {
  return fetchAPI(`/orders/${orderId}/confirmar-pix-cliente`, {
    method: 'PATCH',
  });
}

// Types
export interface Product {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: 'paes' | 'doces' | 'salgados' | 'bebidas' | 'bolos' | 'outros';
  imagemUrl: string;
  disponivel: boolean;
  destaque: boolean;
  ordem: number;
}

export interface Order {
  _id: string;
  numero: string;
  cliente: {
    nome: string;
    telefone: string;
  };
  itens: Array<{
    produto: string;
    nome: string;
    preco: number;
    quantidade: number;
    subtotal: number;
  }>;
  total: number;
  formaPagamento: string;
  statusPagamento: 'pendente' | 'confirmado' | 'recusado';
  statusPedido: 'novo' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';
  observacoes: string;
  dataHora: string;
  pixConfirmadoPeloCliente: boolean;
  pixConfirmadoPeloAdmin: boolean;
}

export interface Settings {
  nomeEstabelecimento: string;
  descricao: string;
  telefone: string;
  endereco: string;
  chavePix: string;
  horarioFuncionamento: string;
  corPrimaria: string;
  corSecundaria: string;
  logoUrl: string;
  aceitaPedidos: boolean;
  mensagemFechado: string;
}
