import { useState } from 'react';
import { useWarehouse } from '@/context/WarehouseContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  const { searchLots } = useWarehouse();
  const [query, setQuery] = useState('');
  const results = query.length >= 2 ? searchLots(query) : [];

  const statusColor = (status: string) => {
    switch (status) {
      case 'stored': return 'bg-success/15 text-success border-success/30';
      case 'partial': return 'bg-warning/15 text-warning border-warning/30';
      case 'dispatched': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search Lots</h1>
        <p className="text-muted-foreground mt-1">Find lots by code, product, client, or production lot</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search lots..."
          className="pl-10 h-12 text-lg"
        />
      </div>

      {query.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No lots found</p>}
            {results.map(lot => (
              <Link key={lot.id} to={`/lots/${lot.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-semibold text-primary">{lot.lotCode}</span>
                  <span className="text-sm">{lot.productPresentation}</span>
                </div>
                <Badge variant="outline" className={statusColor(lot.status)}>{lot.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
