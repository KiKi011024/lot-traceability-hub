import { useWarehouse } from '@/context/WarehouseContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';

export default function LotList() {
  const { lots } = useWarehouse();

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
          <h1 className="text-3xl font-bold text-foreground">Lot Registry</h1>
          <p className="text-muted-foreground mt-1">{lots.length} lots registered</p>
        </div>
        <Button asChild>
          <Link to="/lots/new"><PlusCircle className="h-4 w-4 mr-2" />New Lot</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Lots</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell className="font-mono text-xs">
                    {lot.location.chamber}-{lot.location.rack}-{lot.location.level}-{lot.location.position}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(lot.status)}>{lot.status}</Badge>
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
