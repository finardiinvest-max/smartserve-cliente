import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Copy, AlertCircle } from 'lucide-react';
import { confirmPixPayment, getSettings, Settings, getOrderByNumber, Order } from '@/lib/api';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  novo: {
    label: 'Novo',
    icon: Clock,
    color: 'bg-blue-500',
  },
  em_preparo: {
    label: 'Em Preparo',
    icon: Clock,
    color: 'bg-yellow-500',
  },
  pronto: {
    label: 'Pronto',
    icon: CheckCircle2,
    color: 'bg-green-500',
  },
  entregue: {
    label: 'Entregue',
    icon: CheckCircle2,
    color: 'bg-gray-500',
  },
  cancelado: {
    label: 'Cancelado',
    icon: AlertCircle,
    color: 'bg-red-500',
  },
};

export default function OrderConfirmation() {
  const [, params] = useRoute('/confirmacao/:id');
  const [, navigate] = useLocation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const orderId = params?.id;

  useEffect(() => {
    if (orderId) {
      loadSettings();
      loadOrder();
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadOrder, 30000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  async function loadSettings() {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async function loadOrder() {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const data = await getOrderByNumber(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment() {
    if (!orderId) return;

    try {
      setConfirming(true);
      await confirmPixPayment(orderId);
      toast.success('Pagamento confirmado! Aguarde a validação do estabelecimento.');
      await loadOrder(); // Recarregar pedido para atualizar status
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setConfirming(false);
    }
  }

  function copyPixKey() {
    if (settings?.chavePix) {
      navigator.clipboard.writeText(settings.chavePix);
      toast.success('Chave PIX copiada!');
    }
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Pedido não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Pedido não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.statusPedido];
  const StatusIcon = statusConfig.icon;
  const isPix = order.formaPagamento === 'pix';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Voltar ao Início
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Pedido #{order.numero}</CardTitle>
                <CardDescription>
                  {new Date(order.dataHora).toLocaleString('pt-BR')}
                </CardDescription>
              </div>
              <Badge className={`${statusConfig.color} text-white`}>
                <StatusIcon className="mr-1 h-4 w-4" />
                {statusConfig.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mensagem para manter página aberta */}
            <div className="bg-[#6BAFB8]/10 border-2 border-[#6BAFB8] rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-foreground">
                Mantenha essa página aberta para acompanhar o status do seu pedido
              </p>
            </div>

            {/* PIX Payment Section - Only for PIX orders */}
            {isPix && !order.pixConfirmadoPeloCliente && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Chave PIX:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded text-sm break-all">
                      {settings?.chavePix || 'Carregando...'}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPixKey}
                      disabled={!settings?.chavePix}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Como pagar:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha a opção PIX</li>
                    <li>Cole ou digite a chave PIX acima</li>
                    <li>Confirme o pagamento</li>
                    <li>Volte aqui e clique em "Já Paguei"</li>
                  </ol>
                </div>

                <Button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="w-full"
                  size="lg"
                >
                  {confirming ? 'Confirmando...' : 'Já Paguei'}
                </Button>
              </div>
            )}

            {/* Payment Status - For PIX orders */}
            {isPix && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Status do Pagamento</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {order.pixConfirmadoPeloCliente ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <span>Confirmado pelo cliente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.pixConfirmadoPeloAdmin ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <span>Validado pelo estabelecimento</span>
                  </div>
                </div>
                {!order.pixConfirmadoPeloAdmin && order.pixConfirmadoPeloCliente && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Aguardando validação do pagamento
                  </p>
                )}
              </div>
            )}

            {/* Customer Info */}
            <div>
              <h3 className="font-medium mb-2">Cliente</h3>
              <p className="text-sm">{order.cliente.nome}</p>
              <p className="text-sm text-muted-foreground">{order.cliente.telefone}</p>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-medium mb-2">Itens do Pedido</h3>
              <div className="space-y-2">
                {order.itens.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantidade}x {item.nome}
                    </span>
                    <span className="font-medium">
                      R$ {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Observations */}
            {order.observacoes && (
              <div>
                <h3 className="font-medium mb-2">Observações</h3>
                <p className="text-sm text-muted-foreground">{order.observacoes}</p>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Forma de pagamento: {order.formaPagamento === 'pix' ? 'PIX' : order.formaPagamento.toUpperCase()}
              </p>
            </div>

            {/* Status Message */}
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              {order.statusPedido === 'novo' && (
                <p className="text-sm">Seu pedido foi recebido e está sendo processado</p>
              )}
              {order.statusPedido === 'em_preparo' && (
                <p className="text-sm">Seu pedido está sendo preparado com carinho!</p>
              )}
              {order.statusPedido === 'pronto' && (
                <p className="text-sm font-medium">Seu pedido está pronto! Pode retirar.</p>
              )}
              {order.statusPedido === 'entregue' && (
                <p className="text-sm">Pedido entregue. Obrigado!</p>
              )}
              {order.statusPedido === 'cancelado' && (
                <p className="text-sm">Pedido cancelado.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Esta página atualiza automaticamente a cada 30 segundos
        </p>
      </main>
    </div>
  );
}
