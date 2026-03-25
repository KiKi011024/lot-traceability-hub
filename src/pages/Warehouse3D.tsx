import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import { useWarehouse } from '@/context/WarehouseContext';
import { Lot } from '@/types/lot';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as THREE from 'three';

// Warehouse layout config
// Chamber A: 2 rack blocks, Chamber B: 1 rack block
// Each block: 4 positions wide, 3 levels high
const WAREHOUSE_CONFIG = {
  chambers: [
    {
      id: 'A',
      label: 'Cámara A',
      position: [-6, 0, 0] as [number, number, number],
      size: [10, 5, 6] as [number, number, number],
      racks: [
        { id: '01', offset: [-2, 0, 0] as [number, number, number] },
        { id: '02', offset: [2, 0, 0] as [number, number, number] },
      ],
    },
    {
      id: 'B',
      label: 'Cámara B',
      position: [6, 0, 0] as [number, number, number],
      size: [6, 5, 6] as [number, number, number],
      racks: [
        { id: '01', offset: [0, 0, 0] as [number, number, number] },
      ],
    },
  ],
  levels: 3,
  positions: 4,
};

interface SlotInfo {
  chamber: string;
  rack: string;
  level: string;
  position: string;
  lot: Lot | null;
}

function RackSlot({
  pos,
  slotInfo,
  onHover,
  onLeave,
  onClick,
}: {
  pos: [number, number, number];
  slotInfo: SlotInfo;
  onHover: (info: SlotInfo) => void;
  onLeave: () => void;
  onClick: (info: SlotInfo) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const color = slotInfo.lot
    ? slotInfo.lot.status === 'dispatched'
      ? '#94a3b8'
      : slotInfo.lot.status === 'partial'
        ? '#f59e0b'
        : '#22c55e'
    : '#1e3a5f';

  const emissive = hovered ? '#ffffff' : '#000000';

  return (
    <mesh
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(slotInfo);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        onLeave();
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(slotInfo);
      }}
    >
      <boxGeometry args={[0.8, 0.7, 1.2]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={hovered ? 0.15 : 0}
        transparent
        opacity={slotInfo.lot ? 0.9 : 0.25}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

function RackBlock({
  chamberPos,
  rackOffset,
  chamberId,
  rackId,
  lotMap,
  onHover,
  onLeave,
  onClick,
}: {
  chamberPos: [number, number, number];
  rackOffset: [number, number, number];
  chamberId: string;
  rackId: string;
  lotMap: Map<string, Lot>;
  onHover: (info: SlotInfo) => void;
  onLeave: () => void;
  onClick: (info: SlotInfo) => void;
}) {
  const slots: JSX.Element[] = [];

  for (let level = 0; level < WAREHOUSE_CONFIG.levels; level++) {
    for (let pos = 0; pos < WAREHOUSE_CONFIG.positions; pos++) {
      const levelStr = String(level + 1);
      const posStr = String(pos + 1).padStart(2, '0');
      const key = `${chamberId}-${rackId}-${levelStr}-${posStr}`;
      const lot = lotMap.get(key) || null;

      const x = chamberPos[0] + rackOffset[0] + (pos - 1.5) * 1;
      const y = level * 0.9 + 0.5;
      const z = chamberPos[2] + rackOffset[2];

      slots.push(
        <RackSlot
          key={key}
          pos={[x, y, z]}
          slotInfo={{ chamber: chamberId, rack: rackId, level: levelStr, position: posStr, lot }}
          onHover={onHover}
          onLeave={onLeave}
          onClick={onClick}
        />
      );
    }
  }

  // Rack frame (vertical posts)
  const frameX = chamberPos[0] + rackOffset[0];
  const frameZ = chamberPos[2] + rackOffset[2];

  return (
    <group>
      {slots}
      {/* Frame posts */}
      {[-2, 2].map((dx) => (
        <mesh key={`post-${dx}`} position={[frameX + dx, 1.3, frameZ]}>
          <boxGeometry args={[0.06, 2.8, 0.06]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Shelf planes */}
      {[0, 0.9, 1.8].map((y) => (
        <mesh key={`shelf-${y}`} position={[frameX, y + 0.1, frameZ]}>
          <boxGeometry args={[4.2, 0.04, 1.4]} />
          <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Rack label */}
      <Text
        position={[frameX, 3.2, frameZ]}
        fontSize={0.3}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {`Bloque ${rackId}`}
      </Text>
    </group>
  );
}

function ChamberBox({
  position,
  size,
  label,
}: {
  position: [number, number, number];
  size: [number, number, number];
  label: string;
}) {
  return (
    <group>
      {/* Floor */}
      <mesh position={[position[0], -0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Walls (wireframe) */}
      <mesh position={[position[0], size[1] / 2 - 0.5, position[2]]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#334155" wireframe transparent opacity={0.15} />
      </mesh>
      {/* Label */}
      <Text
        position={[position[0], size[1] + 0.2, position[2]]}
        fontSize={0.5}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

function WarehouseScene({
  onHover,
  onLeave,
  onClick,
  lotMap,
}: {
  onHover: (info: SlotInfo) => void;
  onLeave: () => void;
  onClick: (info: SlotInfo) => void;
  lotMap: Map<string, Lot>;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 14]} fov={50} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <pointLight position={[-6, 6, 0]} intensity={0.3} color="#60a5fa" />
      <pointLight position={[6, 6, 0]} intensity={0.3} color="#f59e0b" />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[30, 30, '#1e293b', '#1e293b']} position={[0, -0.04, 0]} />

      {/* Chambers */}
      {WAREHOUSE_CONFIG.chambers.map((chamber) => (
        <group key={chamber.id}>
          <ChamberBox
            position={chamber.position}
            size={chamber.size}
            label={chamber.label}
          />
          {chamber.racks.map((rack) => (
            <RackBlock
              key={`${chamber.id}-${rack.id}`}
              chamberPos={chamber.position}
              rackOffset={rack.offset}
              chamberId={chamber.id}
              rackId={rack.id}
              lotMap={lotMap}
              onHover={onHover}
              onLeave={onLeave}
              onClick={onClick}
            />
          ))}
        </group>
      ))}
    </>
  );
}

export default function Warehouse3D() {
  const { lots } = useWarehouse();
  const [hoveredSlot, setHoveredSlot] = useState<SlotInfo | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

  // Build a map: "chamber-rack-level-position" -> Lot
  const lotMap = useMemo(() => {
    const map = new Map<string, Lot>();
    lots.forEach((lot) => {
      if (lot.status !== 'dispatched') {
        const key = `${lot.location.chamber}-${lot.location.rack}-${lot.location.level}-${lot.location.position}`;
        map.set(key, lot);
      }
    });
    return map;
  }, [lots]);

  const totalSlots = WAREHOUSE_CONFIG.chambers.reduce(
    (sum, c) => sum + c.racks.length * WAREHOUSE_CONFIG.levels * WAREHOUSE_CONFIG.positions, 0
  );
  const occupiedSlots = lotMap.size;
  const availableSlots = totalSlots - occupiedSlots;

  const displaySlot = selectedSlot || hoveredSlot;

  const statusColor = (status: string) => {
    switch (status) {
      case 'stored': return 'bg-success/15 text-success border-success/30';
      case 'partial': return 'bg-warning/15 text-warning border-warning/30';
      case 'dispatched': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Almacén 3D</h1>
          <p className="text-muted-foreground mt-1">Vista interactiva del almacén de productos terminados</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-success" />
            <span className="text-muted-foreground">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-warning" />
            <span className="text-muted-foreground">Parcial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary/30 border border-primary/50" />
            <span className="text-muted-foreground">Disponible</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono">{totalSlots}</p>
            <p className="text-xs text-muted-foreground">Espacios totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-success">{availableSlots}</p>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-warning">{occupiedSlots}</p>
            <p className="text-xs text-muted-foreground">Ocupados</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        {/* 3D Canvas */}
        <Card className="flex-1 overflow-hidden">
          <div className="h-[520px] bg-[hsl(215,50%,8%)] rounded-lg">
            <Canvas>
              <WarehouseScene
                lotMap={lotMap}
                onHover={setHoveredSlot}
                onLeave={() => { if (!selectedSlot) setHoveredSlot(null); }}
                onClick={(info) => setSelectedSlot(prev => prev?.chamber === info.chamber && prev?.rack === info.rack && prev?.level === info.level && prev?.position === info.position ? null : info)}
              />
            </Canvas>
          </div>
        </Card>

        {/* Info panel */}
        <Card className="w-72 shrink-0">
          <CardContent className="p-4">
            {displaySlot ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Ubicación</p>
                  <p className="text-lg font-mono font-bold text-primary mt-1">
                    {displaySlot.chamber}-{displaySlot.rack}-{displaySlot.level}-{displaySlot.position}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cámara</span>
                    <span className="font-medium">{displaySlot.chamber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bloque</span>
                    <span className="font-medium">{displaySlot.rack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nivel</span>
                    <span className="font-medium">{displaySlot.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posición</span>
                    <span className="font-medium">{displaySlot.position}</span>
                  </div>
                </div>

                {displaySlot.lot ? (
                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-primary">{displaySlot.lot.lotCode}</span>
                      <Badge variant="outline" className={statusColor(displaySlot.lot.status)}>
                        {displaySlot.lot.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{displaySlot.lot.productPresentation}</p>
                      <p className="text-muted-foreground">{displaySlot.lot.client}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {displaySlot.lot.quantityReceived - displaySlot.lot.quantityWithdrawn} / {displaySlot.lot.quantityReceived} unidades
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t">
                    <p className="text-success font-medium text-sm">✓ Espacio disponible</p>
                    <p className="text-xs text-muted-foreground mt-1">Este espacio está libre para almacenar un nuevo lote</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Pasa el cursor o haz clic en un espacio para ver los detalles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
