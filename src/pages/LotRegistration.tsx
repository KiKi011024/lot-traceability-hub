import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/context/WarehouseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const PRODUCT_TYPES = ['Bonito', 'Concha', 'Pota'] as const;

const PRESENTATIONS: Record<string, string[]> = {
  Pota: [
    'Filete de Pota Precocido', 'Filete de Pota Crudo', 'Tentáculo de Pota',
    'Anillas de Pota', 'Recorte de Pota', 'Nucas de Pota',
    'Aleta de Pota', 'Manto de Pota Entero', 'Dados de Pota',
    'Tiras de Pota', 'Pota Seca Salada', 'Reproductora de Pota',
    'Pota en Conserva', 'Harina de Pota', 'Botones de Pota',
    'Mini Filetes de Pota', 'Pota Sazonada', 'Rabas de Pota',
    'Pota para Surimi', 'Pota Deshilachada',
  ],
  Bonito: ['(Presentaciones por definir)'],
  Concha: ['(Presentaciones por definir)'],
};

export default function LotRegistration() {
  const { addLot } = useWarehouse();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    productType: '', productPresentation: '', client: '', productionLot: '',
    quantityReceived: '', chamber: '', rack: '', level: '', position: '',
    observations: '', productionDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productType || !form.productPresentation || !form.client || !form.quantityReceived || !form.chamber) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    const newLot = addLot({
      productPresentation: `${form.productType} - ${form.productPresentation}`,
      client: form.client,
      productionLot: form.productionLot,
      quantityReceived: parseInt(form.quantityReceived),
      location: { chamber: form.chamber, rack: form.rack, level: form.level, position: form.position },
      observations: form.observations,
      productionDate: form.productionDate,
      dispatchDate: null,
    });
    toast.success(`Lot ${newLot.lotCode} registered successfully`);
    navigate(`/lots/${newLot.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Registrar Nuevo Lote</h1>
        <p className="text-muted-foreground mt-1">Ingresa los datos del lote de producto terminado</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Información del Producto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Producto *</Label>
                <Select value={form.productType} onValueChange={(v) => setForm(prev => ({ ...prev, productType: v, productPresentation: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Presentación *</Label>
                <Select value={form.productPresentation} onValueChange={(v) => setForm(prev => ({ ...prev, productPresentation: v }))} disabled={!form.productType}>
                  <SelectTrigger><SelectValue placeholder={form.productType ? 'Seleccionar presentación' : 'Primero selecciona un producto'} /></SelectTrigger>
                  <SelectContent>
                    {(PRESENTATIONS[form.productType] || []).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Input id="client" name="client" value={form.client} onChange={handleChange} placeholder="Nombre del cliente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productionLot">Lote de Producción</Label>
                <Input id="productionLot" name="productionLot" value={form.productionLot} onChange={handleChange} placeholder="Ej: PL-2025-0412" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityReceived">Cantidad Recibida *</Label>
                <Input id="quantityReceived" name="quantityReceived" type="number" value={form.quantityReceived} onChange={handleChange} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productionDate">Fecha de Producción</Label>
                <Input id="productionDate" name="productionDate" type="date" value={form.productionDate} onChange={handleChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Location Assignment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="chamber">Chamber *</Label>
                <Input id="chamber" name="chamber" value={form.chamber} onChange={handleChange} placeholder="A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rack">Rack</Label>
                <Input id="rack" name="rack" value={form.rack} onChange={handleChange} placeholder="01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input id="level" name="level" value={form.level} onChange={handleChange} placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" name="position" value={form.position} onChange={handleChange} placeholder="01" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observations">Observations</Label>
              <Textarea id="observations" name="observations" value={form.observations} onChange={handleChange} placeholder="Any relevant notes about this lot..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button type="submit" className="flex-1">Register Lot</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/lots')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
