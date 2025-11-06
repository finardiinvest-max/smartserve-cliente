import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Copy } from 'lucide-react';
import { confirmPixPayment, getSettings, Settings } from '@/lib/api';
import { toast } from 'sonner';

export default function OrderConfirmation() {
  const [, params] = useRoute('/confirmacao/:id');
  const [, navigate] = useLocation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const orderId = params?.id;

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async function handleConfirmPayment() {
    if (!orderId) return;

    try {
      setLoading(true);
      await confirmPixPayment(orderId);
      setConfirmed(true);
      toast.success('Pagamento confirmado! Aguarde a validação do estabelecimento.');
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setLoading(false);
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
          <CardFooter>
            <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Pagamento Confirmado!</CardTitle>
            <CardDescription>
              Seu pedido está sendo preparado. Você será redirecionado em instantes...
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Pagamento via PIX</CardTitle>
          <CardDescription>
            Realize o pagamento e confirme abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PIX Key */}
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

          {/* Instructions */}
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

          {/* Confirm Button */}
          <Button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Confirmando...' : 'Já Paguei'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Seu pedido será validado pelo estabelecimento antes de entrar em preparo
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Cancelar e Voltar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
