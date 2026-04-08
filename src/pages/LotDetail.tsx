import { useParams, Link } from 'react-router-dom';
import { useWarehouse } from '@/context/WarehouseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, MapPin, Calendar, User, FileText, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { LotMovement } from '@/types/lot';

export default function LotDetail() {
  const { id } = useParams<{ id: string }>();
  const { getLot, addMovement, editMovement } = useWarehouse();
  const lot = getLot(id!);
  const [withdrawQty, setWithdrawQty] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Edit movement state
  const [editingMovement, setEditingMovement] = useState<LotMovement | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!lot) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lote no encontrado</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/lots">Volver a Lotes</Link></Button>
      </div>
    );
  }

  const available = lot.quantityReceived - lot.quantityWithdrawn;
  const unitLabel = lot.unit === 'sacos' ? 'sacos' : 'cajas';

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

  const movementTypeLabel = (type: string) => {
    switch (type) {
      case 'reception': return 'Recepción';
      case 'withdrawal': return 'Salida';
      case 'relocation': return 'Reubicación';
      default: return type;
    }
  };

  const handleWithdraw = () => {
    const qty = parseInt(withdrawQty);
    if (!qty || qty <= 0 || qty > available) {
      toast.error(`Ingresa una cantidad válida (1-${available})`);
      return;
    }
    addMovement(lot.id, { date: new Date().toISOString(), type: 'withdrawal', quantity: qty, notes: withdrawNotes || 'Salida registrada' });
    toast.success(`${qty} ${unitLabel} retirados del lote ${lot.lotCode}`);
    setWithdrawQty('');
    setWithdrawNotes('');
    setDialogOpen(false);
  };

  const openEditDialog = (movement: LotMovement) => {
    setEditingMovement(movement);
    setEditQty(String(movement.quantity));
    setEditNotes(movement.notes);
    setEditDialogOpen(true);
  };

  const handleEditMovement = () => {
    if (!editingMovement) return;
    const qty = parseInt(editQty);
    if (!qty || qty <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    editMovement(lot.id, editingMovement.id, { quantity: qty, notes: editNotes });
    toast.success('Movimiento actualizado');
    setEditDialogOpen(false);
    setEditingMovement(null);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon"><Link to="/lots"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-mono text-primary">{lot.lotCode}</h1>
            <Badge variant="outline" className={statusColor(lot.status)}>{statusLabel(lot.status)}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{lot.productPresentation}</p>
        </div>
        {available > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button>Registrar Salida</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Salida</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Cantidad (disponible: {available} {unitLabel})</Label>
                  <Input type="number" value={withdrawQty} onChange={e => setWithdrawQty(e.target.value)} max={available} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea value={withdrawNotes} onChange={e => setWithdrawNotes(e.target.value)} placeholder="Motivo de la salida..." rows={2} />
                </div>
                <Button onClick={handleWithdraw} className="w-full">Confirmar Salida</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" />Detalles del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Presentación</span><span className="font-medium">{lot.productPresentation}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lote de Producción</span><span className="font-mono">{lot.productionLot}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cantidad Recibida</span><span className="font-mono">{lot.quantityReceived} {unitLabel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cantidad Retirada</span><span className="font-mono">{lot.quantityWithdrawn} {unitLabel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Disponible</span><span className="font-mono font-bold">{available} {unitLabel}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cámara</span><span className="font-mono font-bold">{lot.locations[0]?.chamber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bloque</span><span className="font-mono">{lot.locations[0]?.rack}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Nivel</span><span className="font-mono">{lot.locations[0]?.level}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Posiciones</span><span className="font-mono">{lot.locations.length} ({lot.locations.map(l => l.position).join(', ')})</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" />Cliente</CardTitle>
          </CardHeader>
          <CardContent><span className="font-medium">{lot.client}</span></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Producción</span><span>{lot.productionDate || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Registro</span><span>{new Date(lot.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Despacho</span><span>{lot.dispatchDate || '—'}</span></div>
          </CardContent>
        </Card>
      </div>

      {lot.observations && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" />Observaciones</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm">{lot.observations}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Historial de Movimientos</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lot.movements.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg border text-sm">
                <Badge variant="outline" className={m.type === 'reception' ? 'bg-success/15 text-success border-success/30' : m.type === 'withdrawal' ? 'bg-warning/15 text-warning border-warning/30' : ''}>
                  {movementTypeLabel(m.type)}
                </Badge>
                <span className="font-mono">{m.quantity} {unitLabel}</span>
                <span className="text-muted-foreground flex-1">{m.notes}</span>
                <span className="text-xs text-muted-foreground font-mono">{new Date(m.date).toLocaleString()}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(m)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit movement dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Movimiento</DialogTitle></DialogHeader>
          {editingMovement && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <Badge variant="outline">{movementTypeLabel(editingMovement.type)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha</span>
                  <span className="font-mono text-xs">{new Date(editingMovement.date).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cantidad ({unitLabel})</Label>
                <Input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} min={1} />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} />
              </div>
              <Button onClick={handleEditMovement} className="w-full">Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
