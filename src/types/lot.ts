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

export type UnitType = 'sacos' | 'cajas';

export const MAX_CAPACITY_PER_SLOT = 45;

export interface Lot {
  id: string;
  lotCode: string;
  productPresentation: string;
  client: string;
  productionLot: string;
  quantityReceived: number;
  quantityWithdrawn: number;
  unit: UnitType;
  locations: Location[];
  observations: string;
  productionDate: string;
  dispatchDate: string | null;
  createdAt: string;
  movements: LotMovement[];
  status: 'stored' | 'partial' | 'dispatched';
}

export function formatLocations(locations: Location[]): string {
  if (locations.length === 0) return '-';
  if (locations.length === 1) {
    const l = locations[0];
    return `${l.chamber}-${l.rack}-N${l.level}-${l.position}`;
  }
  const first = locations[0];
  return `${first.chamber}-${first.rack}-N${first.level} (${locations.length} pos.)`;
}

export function formatLocationsShort(locations: Location[]): string {
  if (locations.length === 0) return '-';
  const first = locations[0];
  return `${first.chamber}-${first.rack}${locations.length > 1 ? ` (${locations.length})` : ''}`;
}
