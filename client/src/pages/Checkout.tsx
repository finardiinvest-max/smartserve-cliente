import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { useLocation } from 'wouter';
import { createOrder } from '@/lib/api';
import { toast } from 'sonner';

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, updateQuantity, removeItem, clearCart, subtotal, convenienceFee, total } = useCart();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    formaPagamento: 'pix',
    observacoes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    if (items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        cliente: {
          nome: formData.nome,
          telefone: formData.telefone,
        },
        itens: items.map(item => ({
          produto: item.product._id,
          quantidade: item.quantity,
        })),
        formaPagamento: formData.formaPagamento,
        observacoes: formData.observacoes,
      };

      const response = await createOrder(orderData);
      
      clearCart();
      
      if (formData.formaPagamento === 'pix') {
        navigate(`/confirmacao/${response.order._id}`);
      } else {
        navigate(`/pedido/${response.order.numero}`);
      }
      
      toast.success('Pedido realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Carrinho Vazio</CardTitle>
            <CardDescription>Adicione produtos ao carrinho para continuar</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Cardápio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Seu Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map(item => (
                  <div key={item.product._id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        R$ {item.product.preco.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.product._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-medium">
                      R$ {(item.product.preco * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex justify-between w-full text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {convenienceFee.valor > 0 && (
                  <div className="flex justify-between w-full text-muted-foreground">
                    <span>Taxa de Conveniência ({convenienceFee.percentual}%):</span>
                    <span>R$ {convenienceFee.valor.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Order Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Seus Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={e => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>

                  <div>
                    <Label>Forma de Pagamento *</Label>
                    <RadioGroup
                      value={formData.formaPagamento}
                      onValueChange={value => setFormData(prev => ({ ...prev, formaPagamento: value }))}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dinheiro" id="dinheiro" />
                        <Label htmlFor="dinheiro" className="cursor-pointer">Dinheiro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cartao" id="cartao" />
                        <Label htmlFor="cartao" className="cursor-pointer">Cartão</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="retirada" id="retirada" />
                        <Label htmlFor="retirada" className="cursor-pointer">Pagar na Retirada</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Alguma observação sobre o pedido?"
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Processando...' : 'Confirmar Pedido'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
