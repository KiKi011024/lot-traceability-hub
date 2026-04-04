import React, { createContext, useContext, useState, useCallback } from 'react';
import { Lot, LotMovement } from '@/types/lot';

interface WarehouseContextType {
  lots: Lot[];
  addLot: (lot: Omit<Lot, 'id' | 'lotCode' | 'createdAt' | 'movements' | 'status' | 'quantityWithdrawn'>) => Lot;
  updateLot: (id: string, updates: Partial<Lot>) => void;
  addMovement: (lotId: string, movement: Omit<LotMovement, 'id'>) => void;
  editMovement: (lotId: string, movementId: string, updates: Partial<Omit<LotMovement, 'id'>>) => void;
  getLot: (id: string) => Lot | undefined;
  searchLots: (query: string) => Lot[];
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

function generateLotCode(id: number): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `GAM-${year}${month}-${String(id).padStart(4, '0')}`;
}

const sampleLots: Lot[] = [
  {
    id: '1', lotCode: 'GAM-2603-0001', productPresentation: 'Pota - Filete de Pota Precocido',
    client: 'SuperMarket Plus', productionLot: 'PL-2025-0412', quantityReceived: 500,
    quantityWithdrawn: 120, unit: 'cajas', location: { chamber: 'C', rack: '02', level: '2', position: '03-05' },
    observations: 'Envío prioritario', productionDate: '2026-03-10', dispatchDate: null,
    createdAt: '2026-03-15T08:30:00', movements: [
      { id: 'm1', date: '2026-03-15T08:30:00', type: 'reception', quantity: 500, notes: 'Recepción inicial' },
      { id: 'm2', date: '2026-03-18T14:00:00', type: 'withdrawal', quantity: 120, notes: 'Despacho parcial' },
    ], status: 'partial',
  },
  {
    id: '2', lotCode: 'GAM-2603-0002', productPresentation: 'Pota - Anillas de Pota',
    client: 'FreshMart', productionLot: 'PL-2025-0413', quantityReceived: 300,
    quantityWithdrawn: 0, unit: 'sacos', location: { chamber: 'B', rack: '01', level: '3', position: '02-07' },
    observations: '', productionDate: '2026-03-12', dispatchDate: null,
    createdAt: '2026-03-16T09:15:00', movements: [
      { id: 'm3', date: '2026-03-16T09:15:00', type: 'reception', quantity: 300, notes: 'Recepción inicial' },
    ], status: 'stored',
  },
  {
    id: '3', lotCode: 'GAM-2603-0003', productPresentation: 'Pota - Tentáculo de Pota',
    client: 'MegaStore', productionLot: 'PL-2025-0410', quantityReceived: 200,
    quantityWithdrawn: 200, unit: 'cajas', location: { chamber: 'C', rack: '01', level: '1', position: '01-01' },
    observations: 'Despachado completo', productionDate: '2026-03-08', dispatchDate: '2026-03-20',
    createdAt: '2026-03-10T07:00:00', movements: [
      { id: 'm4', date: '2026-03-10T07:00:00', type: 'reception', quantity: 200, notes: 'Recepción inicial' },
      { id: 'm5', date: '2026-03-20T11:00:00', type: 'withdrawal', quantity: 200, notes: 'Despacho completo' },
    ], status: 'dispatched',
  },
  {
    id: '4', lotCode: 'GAM-2603-0004', productPresentation: 'Pota - Dados de Pota',
    client: 'DistriMax', productionLot: 'PL-2025-0415', quantityReceived: 400,
    quantityWithdrawn: 0, unit: 'sacos', location: { chamber: 'C', rack: '01', level: '2', position: '04-10' },
    observations: '', productionDate: '2026-03-18', dispatchDate: null,
    createdAt: '2026-03-20T10:00:00', movements: [
      { id: 'm6', date: '2026-03-20T10:00:00', type: 'reception', quantity: 400, notes: 'Recepción inicial' },
    ], status: 'stored',
  },
];

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [lots, setLots] = useState<Lot[]>(sampleLots);
  const [nextId, setNextId] = useState(5);

  const addLot = useCallback((lotData: Omit<Lot, 'id' | 'lotCode' | 'createdAt' | 'movements' | 'status' | 'quantityWithdrawn'>) => {
    const id = String(nextId);
    const newLot: Lot = {
      ...lotData,
      id,
      lotCode: generateLotCode(nextId),
      createdAt: new Date().toISOString(),
      quantityWithdrawn: 0,
      movements: [{ id: `m-${Date.now()}`, date: new Date().toISOString(), type: 'reception', quantity: lotData.quantityReceived, notes: 'Recepción inicial' }],
      status: 'stored',
    };
    setLots(prev => [...prev, newLot]);
    setNextId(prev => prev + 1);
    return newLot;
  }, [nextId]);

  const updateLot = useCallback((id: string, updates: Partial<Lot>) => {
    setLots(prev => prev.map(lot => lot.id === id ? { ...lot, ...updates } : lot));
  }, []);

  const addMovement = useCallback((lotId: string, movement: Omit<LotMovement, 'id'>) => {
    setLots(prev => prev.map(lot => {
      if (lot.id !== lotId) return lot;
      const newMovement = { ...movement, id: `m-${Date.now()}` };
      const newWithdrawn = movement.type === 'withdrawal' ? lot.quantityWithdrawn + movement.quantity : lot.quantityWithdrawn;
      const newStatus = newWithdrawn >= lot.quantityReceived ? 'dispatched' : newWithdrawn > 0 ? 'partial' : 'stored';
      return { ...lot, movements: [...lot.movements, newMovement], quantityWithdrawn: newWithdrawn, status: newStatus as Lot['status'] };
    }));
  }, []);

  const editMovement = useCallback((lotId: string, movementId: string, updates: Partial<Omit<LotMovement, 'id'>>) => {
    setLots(prev => prev.map(lot => {
      if (lot.id !== lotId) return lot;
      const updatedMovements = lot.movements.map(m => m.id === movementId ? { ...m, ...updates } : m);
      // Recalculate withdrawn
      const newWithdrawn = updatedMovements
        .filter(m => m.type === 'withdrawal')
        .reduce((sum, m) => sum + m.quantity, 0);
      const newStatus = newWithdrawn >= lot.quantityReceived ? 'dispatched' : newWithdrawn > 0 ? 'partial' : 'stored';
      return { ...lot, movements: updatedMovements, quantityWithdrawn: newWithdrawn, status: newStatus as Lot['status'] };
    }));
  }, []);

  const getLot = useCallback((id: string) => lots.find(l => l.id === id), [lots]);

  const searchLots = useCallback((query: string) => {
    const q = query.toLowerCase();
    return lots.filter(l =>
      l.lotCode.toLowerCase().includes(q) ||
      l.productPresentation.toLowerCase().includes(q) ||
      l.client.toLowerCase().includes(q) ||
      l.productionLot.toLowerCase().includes(q)
    );
  }, [lots]);

  return (
    <WarehouseContext.Provider value={{ lots, addLot, updateLot, addMovement, editMovement, getLot, searchLots }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) throw new Error('useWarehouse must be used within WarehouseProvider');
  return context;
}
