import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { Product, getSettings } from '@/lib/api';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  convenienceFee: { percentual: number; valor: number };
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<any>(null);

  // Load settings
  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems(current => {
      const existing = current.find(item => item.product._id === product._id);
      
      if (existing) {
        return current.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...current, { product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(current => current.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(current =>
      current.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.product.preco * item.quantity), 0);
  }, [items]);

  // Calculate convenience fee
  const convenienceFee = useMemo(() => {
    if (!settings?.taxaConveniencia?.habilitada) {
      return { percentual: 0, valor: 0 };
    }

    const percentual = settings.taxaConveniencia.percentual;
    const valor = parseFloat(((subtotal * percentual) / 100).toFixed(2));

    return { percentual, valor };
  }, [subtotal, settings]);

  // Calculate total
  const total = useMemo(() => {
    return parseFloat((subtotal + convenienceFee.valor).toFixed(2));
  }, [subtotal, convenienceFee]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      convenienceFee,
      total,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
