import { useEffect, useState, useRef } from 'react';
import { getProducts, getSettings, Product, Settings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Minus, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { APP_LOGO } from '@/const';

const CATEGORIAS = [
  { value: 'destaque', label: '⭐ Em Destaque' },
  { value: 'paes', label: 'Pães' },
  { value: 'doces', label: 'Doces' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'bolos', label: 'Bolos' },
  { value: 'pizzas', label: 'Pizzas' },
  { value: 'refeicoes', label: 'Refeições' },
  { value: 'lanches', label: 'Lanches' },
  { value: 'omeletes', label: 'Omeletes' },
  { value: 'bebidas-quentes', label: 'Bebidas Quentes' },
  { value: 'outros', label: 'Outros' },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { addItem, items, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showHero, setShowHero] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  async function loadData() {
    try {
      setLoading(true);
      const [allProductsData, settingsData] = await Promise.all([
        getProducts({ disponivel: true }),
        getSettings(),
      ]);
      
      if (!selectedCategory) {
        // Sem categoria: mostrar destaques separados + todos os outros
        const featured = allProductsData.filter((p: Product) => p.destaque);
        setFeaturedProducts(featured);
        const regularProducts = allProductsData.filter((p: Product) => !p.destaque);
        setProducts(regularProducts);
      } else if (selectedCategory === 'destaque') {
        // Categoria "Em Destaque": mostrar apenas produtos em destaque
        setFeaturedProducts([]);
        const featured = allProductsData.filter((p: Product) => p.destaque);
        setProducts(featured);
      } else {
        // Categoria específica: esconder destaques e filtrar por categoria
        setFeaturedProducts([]);
        const filtered = allProductsData.filter((p: Product) => p.categoria === selectedCategory);
        setProducts(filtered);
      }
      
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

  function scrollToMenu() {
    setShowHero(false);
    setTimeout(() => {
      menuRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!settings?.aceitaPedidos) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
      {/* Hero Section - Olivetanos Style */}
      {showHero && (
        <section className="min-h-screen flex flex-col items-center justify-center relative px-4">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute top-20 right-10 w-64 h-64 bg-muted rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-muted rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center space-y-8">
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-serif text-white tracking-wide">
                {settings?.nomeEstabelecimento || 'Olivetanos'}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-light">
                {settings?.descricao || 'Padaria tradicional na Zona Leste'}
              </p>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={scrollToMenu}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg rounded-xl shadow-lg transition-all hover:scale-105"
            >
              Acesse menu
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <button
              onClick={scrollToMenu}
              className="w-12 h-12 rounded-full border-2 border-white/50 flex items-center justify-center hover:border-white transition-colors"
              aria-label="Rolar para o menu"
            >
              <ChevronDown className="h-6 w-6 text-white animate-bounce" />
            </button>
          </div>
        </section>
      )}

      {/* Menu Section */}
      <div ref={menuRef}>
        {/* Header - Compact */}
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-end">
              <Button
                size="lg"
                onClick={() => navigate('/checkout')}
                className="relative"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Carrinho
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Category Filter - Dropdown */}
        <div className="border-b bg-secondary/30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <label htmlFor="category-select" className="text-sm font-medium text-foreground">
                Categoria:
              </label>
              <Select value={selectedCategory || undefined} onValueChange={(val) => setSelectedCategory(val || '')}>
                <SelectTrigger id="category-select" className="w-[200px]">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="bg-gradient-to-b from-primary/5 to-transparent border-b">
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-primary">⭐</span>
                Produtos em Destaque
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map(product => (
                  <Card key={product._id} className="hover:shadow-lg transition-shadow border-2 border-primary/20">
                    <div className="flex gap-3 p-3">
                      {/* Left side: Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base leading-tight">{product.nome}</h3>
                            {product.descricao && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {product.descricao}
                              </p>
                            )}
                          </div>
                          <Badge variant="default" className="shrink-0 text-xs">Destaque</Badge>
                        </div>
                        
                        <p className="text-lg font-bold text-primary mt-1">
                          R$ {product.preco.toFixed(2)}
                        </p>
                        
                        {/* Quantity and Add button */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(product._id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-2 font-medium text-sm min-w-[2rem] text-center">
                              {quantities[product._id] || 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(product._id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 h-7 text-xs"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                      
                      {/* Right side: Image */}
                      {product.imagemUrl && (
                        <div className="shrink-0">
                          <img
                            src={product.imagemUrl}
                            alt={product.nome}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Products Grid */}
        <main className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">
            {selectedCategory ? CATEGORIAS.find(c => c.value === selectedCategory)?.label : 'Todos os Produtos'}
          </h2>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum produto disponível nesta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <Card key={product._id} className="hover:shadow-lg transition-shadow">
                  <div className="flex gap-3 p-3">
                    {/* Left side: Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight">{product.nome}</h3>
                          {product.descricao && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {product.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-lg font-bold text-primary mt-1">
                        R$ {product.preco.toFixed(2)}
                      </p>
                      
                      {/* Quantity and Add button */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(product._id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 font-medium text-sm min-w-[2rem] text-center">
                            {quantities[product._id] || 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(product._id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          className="flex-1 h-7 text-sm"
                          onClick={() => handleAddToCart(product)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Right side: Small product image */}
                    {product.imagemUrl && (
                      <div className="w-16 h-16 shrink-0 overflow-hidden rounded-md">
                        <img
                          src={product.imagemUrl}
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t mt-12 bg-card">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>{settings?.horarioFuncionamento}</p>
            {settings?.telefone && <p className="mt-1">Tel: {settings.telefone}</p>}
            {settings?.endereco && <p className="mt-1">{settings.endereco}</p>}
          </div>
        </footer>
      </div>
    </div>
  );
}
