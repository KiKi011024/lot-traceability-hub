import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouse } from '@/context/WarehouseContext';
import { UnitType, Location, MAX_CAPACITY_PER_SLOT } from '@/types/lot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
  { id: 'C', label: 'Cámara 3', blocks: ['01', '02'] },
  { id: 'B', label: 'Cámara 2', blocks: ['01'] },
];

const LEVELS = ['1', '2', '3', '4'];
const WIDTH = 6;
const LENGTH = 13;

const UNITS: { value: UnitType; label: string }[] = [
  { value: 'sacos', label: 'Sacos' },
  { value: 'cajas', label: 'Cajas' },
];

function calculatePositions(
  startCol: number, startRow: number, count: number,
  chamber: string, rack: string, level: string,
  occupied: Set<string>
): Location[] | null {
  const positions: Location[] = [];
  let col = startCol;
  let row = startRow;

  while (positions.length < count) {
    if (col > WIDTH) return null; // no more space
    const pos = `${String(col).padStart(2, '0')}-${String(row).padStart(2, '0')}`;
    const key = `${chamber}-${rack}-${level}-${pos}`;
    if (occupied.has(key)) {
      // skip occupied, move to next
      row++;
      if (row > LENGTH) { row = 1; col++; }
      continue;
    }
    positions.push({ chamber, rack, level, position: pos });
    row++;
    if (row > LENGTH) { row = 1; col++; }
  }
  return positions;
}

export default function LotRegistration() {
  const { addLot, getOccupiedPositions } = useWarehouse();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    productType: '', productPresentation: '', client: '', productionLot: '',
    quantityReceived: '', unit: '' as string, chamber: '', rack: '', level: '',
    widthPos: '', lengthPos: '', observations: '', productionDate: '',
  });

  const selectedChamber = CHAMBERS.find(c => c.id === form.chamber);
  const occupiedPositions = useMemo(() => getOccupiedPositions(), [getOccupiedPositions]);

  const quantity = parseInt(form.quantityReceived) || 0;
  const slotsNeeded = quantity > 0 ? Math.ceil(quantity / MAX_CAPACITY_PER_SLOT) : 0;

  const calculatedPositions = useMemo(() => {
    if (!form.chamber || !form.rack || !form.level || !form.widthPos || !form.lengthPos || slotsNeeded === 0) return null;
    return calculatePositions(
      parseInt(form.widthPos), parseInt(form.lengthPos), slotsNeeded,
      form.chamber, form.rack, form.level, occupiedPositions
    );
  }, [form.chamber, form.rack, form.level, form.widthPos, form.lengthPos, slotsNeeded, occupiedPositions]);

  const hasError = slotsNeeded > 0 && calculatedPositions === null && form.widthPos && form.lengthPos;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productType || !form.productPresentation || !form.client || !form.quantityReceived || !form.unit || !form.chamber || !form.rack || !form.level || !form.widthPos || !form.lengthPos) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    if (!calculatedPositions || calculatedPositions.length === 0) {
      toast.error('No hay suficiente espacio disponible desde la posición seleccionada.');
      return;
    }
    const newLot = addLot({
      productPresentation: `${form.productType} - ${form.productPresentation}`,
      client: form.client,
      productionLot: form.productionLot,
      quantityReceived: quantity,
      unit: form.unit as UnitType,
      locations: calculatedPositions,
      observations: form.observations,
      productionDate: form.productionDate,
      dispatchDate: null,
    });
    toast.success(`Lote ${newLot.lotCode} registrado en ${calculatedPositions.length} posiciones`);
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
                {quantity > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Máx. {MAX_CAPACITY_PER_SLOT} por posición → <span className="font-semibold text-foreground">{slotsNeeded} posiciones</span> necesarias
                  </p>
                )}
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
            <p className="text-sm text-muted-foreground">Selecciona la posición inicial. Las posiciones adicionales se asignarán automáticamente de forma consecutiva.</p>
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
                <Label>Columna inicial *</Label>
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
                <Label>Fila inicial *</Label>
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

            {calculatedPositions && calculatedPositions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">✓ Posiciones asignadas ({calculatedPositions.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {calculatedPositions.map((loc, i) => (
                    <Badge key={i} variant="secondary" className="font-mono text-xs">
                      {loc.position}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hasError && (
              <p className="text-sm text-destructive font-medium">⚠ No hay suficientes posiciones disponibles desde este punto. Selecciona otra ubicación.</p>
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
          <Button type="submit" className="flex-1" disabled={!!hasError || !calculatedPositions}>Registrar Lote</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/lots')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
