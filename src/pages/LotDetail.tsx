import { useParams, Link } from 'react-router-dom';
import { useWarehouse } from '@/context/WarehouseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, MapPin, Calendar, User, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LotDetail() {
  const { id } = useParams<{ id: string }>();
  const { getLot, addMovement } = useWarehouse();
  const lot = getLot(id!);
  const [withdrawQty, setWithdrawQty] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!lot) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lot not found</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/lots">Back to Lots</Link></Button>
      </div>
    );
  }

  const available = lot.quantityReceived - lot.quantityWithdrawn;

  const statusColor = (status: string) => {
    switch (status) {
      case 'stored': return 'bg-success/15 text-success border-success/30';
      case 'partial': return 'bg-warning/15 text-warning border-warning/30';
      case 'dispatched': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  const handleWithdraw = () => {
    const qty = parseInt(withdrawQty);
    if (!qty || qty <= 0 || qty > available) {
      toast.error(`Enter a valid quantity (1-${available})`);
      return;
    }
    addMovement(lot.id, { date: new Date().toISOString(), type: 'withdrawal', quantity: qty, notes: withdrawNotes || 'Withdrawal' });
    toast.success(`${qty} units withdrawn from ${lot.lotCode}`);
    setWithdrawQty('');
    setWithdrawNotes('');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon"><Link to="/lots"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-mono text-primary">{lot.lotCode}</h1>
            <Badge variant="outline" className={statusColor(lot.status)}>{lot.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{lot.productPresentation}</p>
        </div>
        {available > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button>Record Withdrawal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Withdrawal</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Quantity (available: {available})</Label>
                  <Input type="number" value={withdrawQty} onChange={e => setWithdrawQty(e.target.value)} max={available} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={withdrawNotes} onChange={e => setWithdrawNotes(e.target.value)} placeholder="Reason for withdrawal..." rows={2} />
                </div>
                <Button onClick={handleWithdraw} className="w-full">Confirm Withdrawal</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" />Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Presentation</span><span className="font-medium">{lot.productPresentation}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Production Lot</span><span className="font-mono">{lot.productionLot}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Qty Received</span><span className="font-mono">{lot.quantityReceived}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Qty Withdrawn</span><span className="font-mono">{lot.quantityWithdrawn}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-mono font-bold">{available}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Chamber</span><span className="font-mono font-bold">{lot.location.chamber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rack</span><span className="font-mono">{lot.location.rack}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span className="font-mono">{lot.location.level}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span className="font-mono">{lot.location.position}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" />Client</CardTitle>
          </CardHeader>
          <CardContent><span className="font-medium">{lot.client}</span></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Production</span><span>{lot.productionDate || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span>{new Date(lot.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Dispatch</span><span>{lot.dispatchDate || '—'}</span></div>
          </CardContent>
        </Card>
      </div>

      {lot.observations && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" />Observations</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm">{lot.observations}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Movement History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lot.movements.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg border text-sm">
                <Badge variant="outline" className={m.type === 'reception' ? 'bg-success/15 text-success border-success/30' : m.type === 'withdrawal' ? 'bg-warning/15 text-warning border-warning/30' : ''}>
                  {m.type}
                </Badge>
                <span className="font-mono">{m.quantity} units</span>
                <span className="text-muted-foreground flex-1">{m.notes}</span>
                <span className="text-xs text-muted-foreground font-mono">{new Date(m.date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
