import { Link, useLocation } from 'react-router-dom';
import { Package, Box, PlusCircle, Search, Warehouse } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Almacén 3D', icon: Box },
  { to: '/lots', label: 'Lotes', icon: Package },
  { to: '/lots/new', label: 'Registrar Lote', icon: PlusCircle },
  { to: '/search', label: 'Buscar', icon: Search },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sidebar-accent">
            <Warehouse className="h-6 w-6 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">GAM CORP</h1>
            <p className="text-xs text-sidebar-foreground/60 font-mono">TRAZABILIDAD</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 font-mono text-center">v1.0 — Sistema de Trazabilidad</p>
      </div>
    </aside>
  );
}
