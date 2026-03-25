export interface Location {
  chamber: string;
  rack: string;
  level: string;
  position: string;
}

export interface LotMovement {
  id: string;
  date: string;
  type: 'reception' | 'withdrawal' | 'relocation';
  quantity: number;
  notes: string;
}

export interface Lot {
  id: string;
  lotCode: string;
  productPresentation: string;
  client: string;
  productionLot: string;
  quantityReceived: number;
  quantityWithdrawn: number;
  location: Location;
  observations: string;
  productionDate: string;
  dispatchDate: string | null;
  createdAt: string;
  movements: LotMovement[];
  status: 'stored' | 'partial' | 'dispatched';
}
