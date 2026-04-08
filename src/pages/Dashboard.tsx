import { useWarehouse } from '@/context/WarehouseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, PackageCheck, PackageMinus, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { lots } = useWarehouse();

  const totalLots = lots.length;
  const storedLots = lots.filter(l => l.status === 'stored').length;
  const partialLots = lots.filter(l => l.status === 'partial').length;
  const dispatchedLots = lots.filter(l => l.status === 'dispatched').length;
  const totalStock = lots.reduce((sum, l) => sum + (l.quantityReceived - l.quantityWithdrawn), 0);

  const recentLots = [...lots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const statusColor = (status: string) => {
    switch (status) {
      case 'stored': return 'bg-success/15 text-success border-success/30';
      case 'partial': return 'bg-warning/15 text-warning border-warning/30';
      case 'dispatched': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Finished goods warehouse overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lots</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLots}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
            <PackageCheck className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{storedLots + partialLots}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalStock} units available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partial</CardTitle>
            <PackageMinus className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{partialLots}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dispatched</CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dispatchedLots}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Lots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLots.map(lot => (
              <Link
                key={lot.id}
                to={`/lots/${lot.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold text-primary">{lot.lotCode}</span>
                  <span className="text-sm text-foreground">{lot.productPresentation}</span>
                  <span className="text-sm text-muted-foreground">{lot.client}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {lot.locations[0]?.chamber}-{lot.locations[0]?.rack}-N{lot.locations[0]?.level}{lot.locations.length > 1 ? ` (${lot.locations.length} pos.)` : `-${lot.locations[0]?.position}`}
                  </span>
                  <Badge variant="outline" className={statusColor(lot.status)}>
                    {lot.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
