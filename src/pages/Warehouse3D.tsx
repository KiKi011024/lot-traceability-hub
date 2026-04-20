import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import { useWarehouse } from '@/context/WarehouseContext';
import { Lot, MAX_CAPACITY_PER_SLOT, chamberDisplay } from '@/types/lot';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';

// Warehouse layout: Chamber C has 2 blocks, Chamber B has 1 block
// Each block: 6 wide × 13 long × 4 levels high
const WAREHOUSE_CONFIG = {
  chambers: [
    {
      id: 'C',
      label: 'Cámara 3',
      blocks: [
        { id: '01', label: 'Bloque 01' },
        { id: '02', label: 'Bloque 02' },
      ],
    },
    {
      id: 'B',
      label: 'Cámara 2',
      blocks: [
        { id: '01', label: 'Bloque 01' },
      ],
    },
  ],
  width: 6,   // positions wide (X)
  length: 13, // positions long (Z)
  levels: 4,  // levels high (Y)
};

interface SlotInfo {
  chamber: string;
  rack: string;
  level: string;
  position: string; // encoded as "WW-LL" (width-length)
  widthIdx: number;
  lengthIdx: number;
  levelIdx: number;
  lot: Lot | null;
  slotQuantity: number; // how many units in this specific slot
}

const SLOT_SIZE = { x: 0.85, y: 0.65, z: 0.85 };
const GAP = 0.08;
const CELL_X = SLOT_SIZE.x + GAP;
const CELL_Y = SLOT_SIZE.y + GAP;
const CELL_Z = SLOT_SIZE.z + GAP;

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
      : slotInfo.slotQuantity < MAX_CAPACITY_PER_SLOT
        ? '#f59e0b'
        : '#22c55e'
    : '#cbd5e1';

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
      <boxGeometry args={[SLOT_SIZE.x, SLOT_SIZE.y, SLOT_SIZE.z]} />
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

function BlockScene({
  blockId,
  chamberId,
  lotMap,
  onHover,
  onLeave,
  onClick,
}: {
  blockId: string;
  chamberId: string;
  lotMap: Map<string, { lot: Lot; quantity: number }>;
  onHover: (info: SlotInfo) => void;
  onLeave: () => void;
  onClick: (info: SlotInfo) => void;
}) {
  const { width, length, levels } = WAREHOUSE_CONFIG;

  // Center the block
  const offsetX = -(width - 1) * CELL_X / 2;
  const offsetZ = -(length - 1) * CELL_Z / 2;

  const slots: JSX.Element[] = [];
  const posts: JSX.Element[] = [];
  const shelves: JSX.Element[] = [];

  for (let lvl = 0; lvl < levels; lvl++) {
    for (let w = 0; w < width; w++) {
      for (let l = 0; l < length; l++) {
        const levelStr = String(lvl + 1);
        const posStr = `${String(w + 1).padStart(2, '0')}-${String(l + 1).padStart(2, '0')}`;
        const key = `${chamberId}-${blockId}-${levelStr}-${posStr}`;
        const entry = lotMap.get(key) || null;

        const x = offsetX + w * CELL_X;
        const y = lvl * CELL_Y + SLOT_SIZE.y / 2;
        const z = offsetZ + l * CELL_Z;

        slots.push(
          <RackSlot
            key={key}
            pos={[x, y, z]}
            slotInfo={{
              chamber: chamberId,
              rack: blockId,
              level: levelStr,
              position: posStr,
              widthIdx: w,
              lengthIdx: l,
              levelIdx: lvl,
              lot: entry?.lot || null,
              slotQuantity: entry?.quantity || 0,
            }}
            onHover={onHover}
            onLeave={onLeave}
            onClick={onClick}
          />
        );
      }
    }

    // Shelf plane at base of each level
    const totalW = width * CELL_X;
    const totalL = length * CELL_Z;
    shelves.push(
      <mesh key={`shelf-${lvl}`} position={[0, lvl * CELL_Y + 0.01, 0]}>
        <boxGeometry args={[totalW + 0.1, 0.03, totalL + 0.1]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} transparent opacity={0.35} />
      </mesh>
    );
  }

  // Vertical posts at 4 corners
  const totalH = levels * CELL_Y;
  const hw = (width * CELL_X) / 2 + 0.05;
  const hl = (length * CELL_Z) / 2 + 0.05;
  for (const [cx, cz] of [[-hw, -hl], [hw, -hl], [-hw, hl], [hw, hl]]) {
    posts.push(
      <mesh key={`post-${cx}-${cz}`} position={[cx, totalH / 2, cz]}>
        <boxGeometry args={[0.05, totalH, 0.05]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>
    );
  }

  return (
    <group>
      {slots}
      {shelves}
      {posts}
    </group>
  );
}

function WarehouseScene({
  chamberId,
  blockId,
  onHover,
  onLeave,
  onClick,
  lotMap,
}: {
  chamberId: string;
  blockId: string;
  onHover: (info: SlotInfo) => void;
  onLeave: () => void;
  onClick: (info: SlotInfo) => void;
  lotMap: Map<string, { lot: Lot; quantity: number }>;
}) {
  const { width, length, levels } = WAREHOUSE_CONFIG;
  const totalL = length * CELL_Z;
  const camDist = Math.max(totalL, width * CELL_X) * 1.1;

  return (
    <>
      <PerspectiveCamera makeDefault position={[camDist * 0.6, camDist * 0.5, camDist * 0.7]} fov={50} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.1}
      />

      <color attach="background" args={['#ffffff']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.7} castShadow />
      <pointLight position={[-5, 6, 0]} intensity={0.3} color="#3b82f6" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <gridHelper args={[30, 30, '#e2e8f0', '#e2e8f0']} position={[0, -0.04, 0]} />

      {/* Block label */}
      <Text
        position={[0, levels * CELL_Y + 0.5, 0]}
        fontSize={0.4}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        font={undefined}
      >
        {`Bloque ${blockId}`}
      </Text>

      {/* Axis labels */}
      <Text position={[0, -0.3, totalL / 2 + 0.8]} fontSize={0.25} color="#64748b" anchorX="center" font={undefined}>
        Largo (13 pos.)
      </Text>
      <Text position={[(width * CELL_X) / 2 + 0.8, -0.3, 0]} fontSize={0.25} color="#64748b" anchorX="center" font={undefined} rotation={[0, -Math.PI / 2, 0]}>
        Ancho (6 pos.)
      </Text>

      <BlockScene
        blockId={blockId}
        chamberId={chamberId}
        lotMap={lotMap}
        onHover={onHover}
        onLeave={onLeave}
        onClick={onClick}
      />
    </>
  );
}

export default function Warehouse3D() {
  const { lots } = useWarehouse();
  const [selectedChamber, setSelectedChamber] = useState('C');
  const [selectedBlock, setSelectedBlock] = useState('01');
  const [hoveredSlot, setHoveredSlot] = useState<SlotInfo | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

  const chamber = WAREHOUSE_CONFIG.chambers.find(c => c.id === selectedChamber)!;

  // Reset block if not available in selected chamber
  const currentBlock = chamber.blocks.find(b => b.id === selectedBlock) ? selectedBlock : chamber.blocks[0].id;

  const lotMap = useMemo(() => {
    const map = new Map<string, { lot: Lot; quantity: number }>();
    lots.forEach((lot) => {
      if (lot.status !== 'dispatched') {
        const remaining = lot.quantityReceived - lot.quantityWithdrawn;
        lot.locations.forEach((loc, idx) => {
          const key = `${loc.chamber}-${loc.rack}-${loc.level}-${loc.position}`;
          // Each slot holds up to MAX_CAPACITY_PER_SLOT; last slot gets the remainder
          const slotQty = Math.min(MAX_CAPACITY_PER_SLOT, remaining - idx * MAX_CAPACITY_PER_SLOT);
          map.set(key, { lot, quantity: Math.max(0, slotQty) });
        });
      }
    });
    return map;
  }, [lots]);

  const { width, length, levels } = WAREHOUSE_CONFIG;
  const slotsPerBlock = width * length * levels;
  const totalSlotsInChamber = chamber.blocks.length * slotsPerBlock;

  // Count occupied in current chamber
  const occupiedInChamber = useMemo(() => {
    let count = 0;
    lotMap.forEach((_, key) => {
      if (key.startsWith(`${selectedChamber}-`)) count++;
    });
    return count;
  }, [lotMap, selectedChamber]);

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
          <p className="text-muted-foreground mt-1">Vista interactiva del almacén — {chamber.label}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-success" />
            <span className="text-muted-foreground">Completo (45)</span>
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

      {/* Chamber & Block selector */}
      <div className="flex gap-3 items-center">
        <div className="flex gap-2">
          {WAREHOUSE_CONFIG.chambers.map((c) => (
            <Button
              key={c.id}
              variant={selectedChamber === c.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedChamber(c.id);
                setSelectedSlot(null);
                setHoveredSlot(null);
                // Reset block to first available
                const firstBlock = WAREHOUSE_CONFIG.chambers.find(ch => ch.id === c.id)!.blocks[0].id;
                setSelectedBlock(firstBlock);
              }}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex gap-2">
          {chamber.blocks.map((b) => (
            <Button
              key={b.id}
              variant={currentBlock === b.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setSelectedBlock(b.id);
                setSelectedSlot(null);
                setHoveredSlot(null);
              }}
            >
              {b.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono">{totalSlotsInChamber}</p>
            <p className="text-xs text-muted-foreground">Espacios en {chamber.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-success">{totalSlotsInChamber - occupiedInChamber}</p>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-warning">{occupiedInChamber}</p>
            <p className="text-xs text-muted-foreground">Ocupados</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        {/* 3D Canvas */}
        <Card className="flex-1 overflow-hidden">
          <div className="h-[520px] bg-white rounded-lg">
            <Canvas>
              <WarehouseScene
                chamberId={selectedChamber}
                blockId={currentBlock}
                lotMap={lotMap}
                onHover={setHoveredSlot}
                onLeave={() => { if (!selectedSlot) setHoveredSlot(null); }}
                onClick={(info) => setSelectedSlot(prev =>
                  prev?.chamber === info.chamber && prev?.rack === info.rack && prev?.level === info.level && prev?.position === info.position ? null : info
                )}
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
                    {chamberDisplay(displaySlot.chamber)}-{displaySlot.rack}-N{displaySlot.level}-{displaySlot.position}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cámara</span>
                    <span className="font-medium">{chamberDisplay(displaySlot.chamber)}</span>
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
                    <span className="text-muted-foreground">Fila × Col</span>
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
                        {displaySlot.slotQuantity} / {MAX_CAPACITY_PER_SLOT} {displaySlot.lot.unit} en este espacio
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        Lote total: {displaySlot.lot.quantityReceived - displaySlot.lot.quantityWithdrawn} / {displaySlot.lot.quantityReceived} {displaySlot.lot.unit}
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
