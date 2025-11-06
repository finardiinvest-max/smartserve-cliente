import { useEffect, useState } from 'react';
import { getProducts, getSettings, Product, Settings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

const CATEGORIAS = [
  { value: 'paes', label: 'Pães' },
  { value: 'doces', label: 'Doces' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'bolos', label: 'Bolos' },
  { value: 'outros', label: 'Outros' },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { addItem, items, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  async function loadData() {
    try {
      setLoading(true);
      const [productsData, settingsData] = await Promise.all([
        getProducts({ categoria: selectedCategory || undefined, disponivel: true }),
        getSettings(),
      ]);
      setProducts(productsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar cardápio');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product: Product) {
    const quantity = quantities[product._id] || 1;
    addItem(product, quantity);
    toast.success(`${product.nome} adicionado ao carrinho!`);
    setQuantities(prev => ({ ...prev, [product._id]: 1 }));
  }

  function updateQuantity(productId: string, delta: number) {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [productId]: newValue };
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!settings?.aceitaPedidos) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Pedidos Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{settings?.mensagemFechado}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{settings?.nomeEstabelecimento}</h1>
              <p className="text-sm text-muted-foreground">{settings?.descricao}</p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/checkout')}
              className="relative"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Carrinho
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('')}
              size="sm"
            >
              Todos
            </Button>
            {CATEGORIAS.map(cat => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.value)}
                size="sm"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto disponível nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Card key={product._id} className="flex flex-col">
                {product.imagemUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={product.imagemUrl}
                      alt={product.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{product.nome}</CardTitle>
                    {product.destaque && (
                      <Badge variant="secondary">Destaque</Badge>
                    )}
                  </div>
                  {product.descricao && (
                    <CardDescription>{product.descricao}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-2xl font-bold text-primary">
                    R$ {product.preco.toFixed(2)}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(product._id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 font-medium">
                      {quantities[product._id] || 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(product._id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    className="flex-1"
                    onClick={() => handleAddToCart(product)}
                  >
                    Adicionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>{settings?.horarioFuncionamento}</p>
          {settings?.telefone && <p className="mt-1">Tel: {settings.telefone}</p>}
          {settings?.endereco && <p className="mt-1">{settings.endereco}</p>}
        </div>
      </footer>
    </div>
  );
}
