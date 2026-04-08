import { useWarehouse } from '@/context/WarehouseContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';

export default function LotList() {
  const { lots } = useWarehouse();

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
          <h1 className="text-3xl font-bold text-foreground">Registro de Lotes</h1>
          <p className="text-muted-foreground mt-1">{lots.length} lotes registrados</p>
        </div>
        <Button asChild>
          <Link to="/lots/new"><PlusCircle className="h-4 w-4 mr-2" />Nuevo Lote</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Todos los Lotes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map(lot => (
                <TableRow key={lot.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link to={`/lots/${lot.id}`} className="font-mono font-semibold text-primary hover:underline">
                      {lot.lotCode}
                    </Link>
                  </TableCell>
                  <TableCell>{lot.productPresentation}</TableCell>
                  <TableCell>{lot.client}</TableCell>
                  <TableCell className="font-mono">
                    {lot.quantityReceived - lot.quantityWithdrawn}/{lot.quantityReceived}
                  </TableCell>
                  <TableCell className="capitalize">{lot.unit}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {lot.locations[0]?.chamber}-{lot.locations[0]?.rack}-N{lot.locations[0]?.level}{lot.locations.length > 1 ? ` (${lot.locations.length} pos.)` : `-${lot.locations[0]?.position}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(lot.status)}>{statusLabel(lot.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
