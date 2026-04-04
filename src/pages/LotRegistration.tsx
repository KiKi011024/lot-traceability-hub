import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/context/WarehouseContext';
import { UnitType } from '@/types/lot';
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

const CHAMBERS = [
  { id: 'C', label: 'Cámara C', blocks: ['01', '02'] },
  { id: 'B', label: 'Cámara B', blocks: ['01'] },
];

const LEVELS = ['1', '2', '3', '4'];
const WIDTH = 6;
const LENGTH = 13;

const UNITS: { value: UnitType; label: string }[] = [
  { value: 'sacos', label: 'Sacos' },
  { value: 'cajas', label: 'Cajas' },
];

export default function LotRegistration() {
  const { addLot, lots } = useWarehouse();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    productType: '', productPresentation: '', client: '', productionLot: '',
    quantityReceived: '', unit: '' as string, chamber: '', rack: '', level: '',
    widthPos: '', lengthPos: '', observations: '', productionDate: '',
  });

  const selectedChamber = CHAMBERS.find(c => c.id === form.chamber);

  const occupiedPositions = useMemo(() => {
    const set = new Set<string>();
    lots.forEach(lot => {
      if (lot.status !== 'dispatched') {
        set.add(`${lot.location.chamber}-${lot.location.rack}-${lot.location.level}-${lot.location.position}`);
      }
    });
    return set;
  }, [lots]);

  const currentPositionKey = form.chamber && form.rack && form.level && form.widthPos && form.lengthPos
    ? `${form.chamber}-${form.rack}-${form.level}-${form.widthPos.padStart(2, '0')}-${form.lengthPos.padStart(2, '0')}`
    : null;

  const isPositionOccupied = currentPositionKey ? occupiedPositions.has(currentPositionKey) : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productType || !form.productPresentation || !form.client || !form.quantityReceived || !form.unit || !form.chamber || !form.rack || !form.level || !form.widthPos || !form.lengthPos) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    if (isPositionOccupied) {
      toast.error('Esta posición ya está ocupada. Selecciona otra ubicación.');
      return;
    }
    const position = `${form.widthPos.padStart(2, '0')}-${form.lengthPos.padStart(2, '0')}`;
    const newLot = addLot({
      productPresentation: `${form.productType} - ${form.productPresentation}`,
      client: form.client,
      productionLot: form.productionLot,
      quantityReceived: parseInt(form.quantityReceived),
      unit: form.unit as UnitType,
      location: { chamber: form.chamber, rack: form.rack, level: form.level, position },
      observations: form.observations,
      productionDate: form.productionDate,
      dispatchDate: null,
    });
    toast.success(`Lote ${newLot.lotCode} registrado exitosamente`);
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
                <Label>Unidad *</Label>
                <Select value={form.unit} onValueChange={(v) => setForm(prev => ({ ...prev, unit: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar unidad" /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productionDate">Fecha de Producción</Label>
                <Input id="productionDate" name="productionDate" type="date" value={form.productionDate} onChange={handleChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Asignación de Ubicación</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Cámara *</Label>
                <Select value={form.chamber} onValueChange={(v) => setForm(prev => ({ ...prev, chamber: v, rack: '', level: '', widthPos: '', lengthPos: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cámara" /></SelectTrigger>
                  <SelectContent>
                    {CHAMBERS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bloque *</Label>
                <Select value={form.rack} onValueChange={(v) => setForm(prev => ({ ...prev, rack: v }))} disabled={!form.chamber}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar bloque" /></SelectTrigger>
                  <SelectContent>
                    {(selectedChamber?.blocks || []).map(b => <SelectItem key={b} value={b}>Bloque {b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nivel *</Label>
                <Select value={form.level} onValueChange={(v) => setForm(prev => ({ ...prev, level: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => <SelectItem key={l} value={l}>Nivel {l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ancho (Columna) *</Label>
                <Select value={form.widthPos} onValueChange={(v) => setForm(prev => ({ ...prev, widthPos: v }))}>
                  <SelectTrigger><SelectValue placeholder="Col." /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: WIDTH }, (_, i) => String(i + 1)).map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Largo (Fila) *</Label>
                <Select value={form.lengthPos} onValueChange={(v) => setForm(prev => ({ ...prev, lengthPos: v }))}>
                  <SelectTrigger><SelectValue placeholder="Fila" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: LENGTH }, (_, i) => String(i + 1)).map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isPositionOccupied && (
              <p className="text-sm text-destructive font-medium">⚠ Esta posición ya está ocupada por otro lote.</p>
            )}
            {currentPositionKey && !isPositionOccupied && (
              <p className="text-sm text-success font-medium">✓ Posición disponible</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Información Adicional</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea id="observations" name="observations" value={form.observations} onChange={handleChange} placeholder="Notas relevantes sobre este lote..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button type="submit" className="flex-1" disabled={isPositionOccupied}>Registrar Lote</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/lots')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
