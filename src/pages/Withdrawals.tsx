import { useState } from 'react';
import { useWarehouse } from '@/context/WarehouseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowDownRight, Package, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Withdrawals() {
  const { lots, addMovement } = useWarehouse();
  const [search, setSearch] = useState('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [withdrawQty, setWithdrawQty] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeLots = lots.filter(l => l.status !== 'dispatched');
  const filteredLots = search
    ? activeLots.filter(l =>
        l.lotCode.toLowerCase().includes(search.toLowerCase()) ||
        l.productPresentation.toLowerCase().includes(search.toLowerCase()) ||
        l.client.toLowerCase().includes(search.toLowerCase())
      )
    : activeLots;

  const selectedLot = lots.find(l => l.id === selectedLotId);
  const available = selectedLot ? selectedLot.quantityReceived - selectedLot.quantityWithdrawn : 0;

  const handleWithdraw = () => {
    if (!selectedLot) return;
    const qty = parseInt(withdrawQty);
    if (!qty || qty <= 0 || qty > available) {
      toast.error(`Ingresa una cantidad válida (1-${available})`);
      return;
    }
    addMovement(selectedLot.id, {
      date: new Date().toISOString(),
      type: 'withdrawal',
      quantity: qty,
      notes: withdrawNotes || 'Salida registrada',
    });
    toast.success(`${qty} ${selectedLot.unit} retirados del lote ${selectedLot.lotCode}`);
    setWithdrawQty('');
    setWithdrawNotes('');
    setSelectedLotId('');
    setDialogOpen(false);
  };

  // Recent withdrawals across all lots
  const recentWithdrawals = lots
    .flatMap(l => l.movements.filter(m => m.type === 'withdrawal').map(m => ({ ...m, lot: l })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  const statusLabel = (status: string) => {
    switch (status) {
      case 'stored': return 'Almacenado';
      case 'partial': return 'Parcial';
      case 'dispatched': return 'Despachado';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'stored': return 'bg-success/15 text-success border-success/30';
      case 'partial': return 'bg-warning/15 text-warning border-warning/30';
      case 'dispatched': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salidas</h1>
          <p className="text-muted-foreground mt-1">Registrar retiros y despachos de lotes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Nueva Salida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Salida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Lote</Label>
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLots.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.lotCode} — {l.productPresentation} ({l.quantityReceived - l.quantityWithdrawn} {l.unit} disp.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedLot && (
                <>
                  <div className="rounded-lg border p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Producto</span>
                      <span className="font-medium">{selectedLot.productPresentation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente</span>
                      <span>{selectedLot.client}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ubicación</span>
                      <span className="font-mono text-xs">
                        {selectedLot.location.chamber}-{selectedLot.location.rack}-N{selectedLot.location.level}-{selectedLot.location.position}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Disponible</span>
                      <span className="font-mono font-bold text-success">{available}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad a retirar</Label>
                    <Input
                      type="number"
                      value={withdrawQty}
                      onChange={e => setWithdrawQty(e.target.value)}
                      max={available}
                      min={1}
                      placeholder={`Máx. ${available}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea
                      value={withdrawNotes}
                      onChange={e => setWithdrawNotes(e.target.value)}
                      placeholder="Motivo de la salida..."
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleWithdraw} className="w-full">
                    Confirmar Salida
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono">{activeLots.length}</p>
            <p className="text-xs text-muted-foreground">Lotes activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-success">
              {activeLots.reduce((sum, l) => sum + (l.quantityReceived - l.quantityWithdrawn), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Unidades disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-warning">
              {lots.reduce((sum, l) => sum + l.quantityWithdrawn, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total retirado</p>
          </CardContent>
        </Card>
      </div>

      {/* Active lots for quick withdrawal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lotes con Stock</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lote..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLots.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No hay lotes activos</p>
            ) : (
              filteredLots.map(lot => {
                const avail = lot.quantityReceived - lot.quantityWithdrawn;
                return (
                  <div
                    key={lot.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">{lot.lotCode}</span>
                        <Badge variant="outline" className={statusColor(lot.status)}>
                          {statusLabel(lot.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{lot.productPresentation} — {lot.client}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold">{avail} <span className="text-muted-foreground font-normal">/ {lot.quantityReceived} {lot.unit}</span></p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {lot.location.chamber}-{lot.location.rack}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLotId(lot.id);
                        setDialogOpen(true);
                      }}
                    >
                      Retirar
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salidas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentWithdrawals.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No hay salidas registradas</p>
          ) : (
            <div className="space-y-2">
              {recentWithdrawals.map(w => (
                <div key={w.id} className="flex items-center gap-4 p-3 rounded-lg border text-sm">
                  <ArrowDownRight className="h-4 w-4 text-warning shrink-0" />
                  <span className="font-mono text-primary font-semibold">{w.lot.lotCode}</span>
                  <span className="font-mono">{w.quantity} uds.</span>
                  <span className="text-muted-foreground flex-1 truncate">{w.notes}</span>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {new Date(w.date).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
