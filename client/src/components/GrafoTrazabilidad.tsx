import { useEffect, useRef, useState } from "react";
import { Info, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Nodo {
  id: string;
  label: string;
  type: "Principal" | "Coincidente" | "Externo";
  personaId: number | null;
  isCentral: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Arista {
  id: number;
  from: string;
  to: string;
  title: string;
  weight: number;
  transactionType: string;
}

interface GrafoTrazabilidadProps {
  nodos: Nodo[];
  aristas: Arista[];
  onNodeClick?: (nodo: Nodo) => void;
}

export function GrafoTrazabilidad({ nodos, aristas, onNodeClick }: GrafoTrazabilidadProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodosConPosicion, setNodosConPosicion] = useState<Nodo[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const WIDTH = 800;
  const HEIGHT = 600;
  const NODE_RADIUS = 25;

  // Inicializar posiciones de nodos con un layout circular
  useEffect(() => {
    if (nodos.length === 0) return;

    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const radius = Math.min(WIDTH, HEIGHT) / 3;

    const nodosInicializados = nodos.map((nodo, index) => {
      if (nodo.isCentral) {
        // Nodo central en el centro
        return { ...nodo, x: centerX, y: centerY, vx: 0, vy: 0 };
      } else {
        // Otros nodos en círculo alrededor del centro
        const angle = (index / (nodos.length - 1)) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { ...nodo, x, y, vx: 0, vy: 0 };
      }
    });

    setNodosConPosicion(nodosInicializados);
  }, [nodos]);

  // Simulación de fuerza simple para mejorar el layout
  useEffect(() => {
    if (nodosConPosicion.length === 0) return;

    const interval = setInterval(() => {
      setNodosConPosicion((prevNodos) => {
        const newNodos = prevNodos.map((nodo) => ({ ...nodo }));

        // Aplicar fuerzas de repulsión entre nodos
        for (let i = 0; i < newNodos.length; i++) {
          for (let j = i + 1; j < newNodos.length; j++) {
            const dx = newNodos[j].x! - newNodos[i].x!;
            const dy = newNodos[j].y! - newNodos[i].y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100 && distance > 0) {
              const force = (100 - distance) / distance * 0.5;
              const fx = (dx / distance) * force;
              const fy = (dy / distance) * force;
              
              if (!newNodos[i].isCentral) {
                newNodos[i].vx = (newNodos[i].vx || 0) - fx;
                newNodos[i].vy = (newNodos[i].vy || 0) - fy;
              }
              if (!newNodos[j].isCentral) {
                newNodos[j].vx = (newNodos[j].vx || 0) + fx;
                newNodos[j].vy = (newNodos[j].vy || 0) + fy;
              }
            }
          }
        }

        // Aplicar fuerzas de atracción en aristas
        aristas.forEach((arista) => {
          const source = newNodos.find((n) => n.id === arista.from);
          const target = newNodos.find((n) => n.id === arista.to);
          
          if (source && target) {
            const dx = target.x! - source.x!;
            const dy = target.y! - source.y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const optimalDistance = 150;
            
            if (distance > 0) {
              const force = (distance - optimalDistance) * 0.01;
              const fx = (dx / distance) * force;
              const fy = (dy / distance) * force;
              
              if (!source.isCentral) {
                source.vx = (source.vx || 0) + fx;
                source.vy = (source.vy || 0) + fy;
              }
              if (!target.isCentral) {
                target.vx = (target.vx || 0) - fx;
                target.vy = (target.vy || 0) - fy;
              }
            }
          }
        });

        // Actualizar posiciones con velocidades y fricción
        newNodos.forEach((nodo) => {
          if (!nodo.isCentral && nodo.id !== draggingNode) {
            nodo.x = nodo.x! + (nodo.vx || 0);
            nodo.y = nodo.y! + (nodo.vy || 0);
            nodo.vx = (nodo.vx || 0) * 0.8; // fricción
            nodo.vy = (nodo.vy || 0) * 0.8;

            // Mantener dentro del canvas
            nodo.x = Math.max(NODE_RADIUS, Math.min(WIDTH - NODE_RADIUS, nodo.x));
            nodo.y = Math.max(NODE_RADIUS, Math.min(HEIGHT - NODE_RADIUS, nodo.y));
          }
        });

        return newNodos;
      });
    }, 50);

    // Detener después de 5 segundos
    setTimeout(() => clearInterval(interval), 5000);

    return () => clearInterval(interval);
  }, [nodosConPosicion.length, aristas, draggingNode]);

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - offset.x;
      const y = (e.clientY - rect.top) / zoom - offset.y;

      setNodosConPosicion((prev) =>
        prev.map((nodo) =>
          nodo.id === draggingNode ? { ...nodo, x, y, vx: 0, vy: 0 } : nodo
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const getNodeColor = (type: string): string => {
    switch (type) {
      case "Principal":
        return "#ef4444"; // Rojo
      case "Coincidente":
        return "#f97316"; // Naranja
      case "Externo":
        return "#9ca3af"; // Gris
      default:
        return "#6b7280";
    }
  };

  const handleNodeClick = (nodo: Nodo) => {
    if (nodo.type === "Externo" && onNodeClick) {
      onNodeClick(nodo);
    }
  };

  return (
    <div className="space-y-4">
      {/* Leyenda */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Principal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>Coincidente (Caso relacionado)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span>Externo (Click para expandir)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
            data-testid="button-reset-view"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas del Grafo */}
      <div 
        ref={canvasRef}
        className="border rounded-lg bg-white overflow-hidden relative"
        style={{ width: WIDTH, height: HEIGHT }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={WIDTH}
          height={HEIGHT}
          style={{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)` }}
        >
          <defs>
            {/* Definir marcadores de flecha */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
            </marker>
          </defs>

          {/* Renderizar aristas */}
          {aristas.map((arista) => {
            const source = nodosConPosicion.find((n) => n.id === arista.from);
            const target = nodosConPosicion.find((n) => n.id === arista.to);

            if (!source || !target) return null;

            // Calcular punto final para la flecha (acortado para que no entre en el nodo)
            const dx = target.x! - source.x!;
            const dy = target.y! - source.y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const targetX = target.x! - (dx / distance) * NODE_RADIUS;
            const targetY = target.y! - (dy / distance) * NODE_RADIUS;

            return (
              <g key={arista.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={targetX}
                  y2={targetY}
                  stroke={hoveredEdge === arista.id ? "#3b82f6" : "#d1d5db"}
                  strokeWidth={Math.max(1, arista.weight / 2)}
                  markerEnd="url(#arrowhead)"
                  onMouseEnter={() => setHoveredEdge(arista.id)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  style={{ cursor: "pointer" }}
                />
                {hoveredEdge === arista.id && (
                  <text
                    x={(source.x! + target.x!) / 2}
                    y={(source.y! + target.y!) / 2}
                    textAnchor="middle"
                    fill="#1f2937"
                    fontSize="10"
                    fontWeight="bold"
                    style={{ pointerEvents: "none" }}
                  >
                    {arista.title}
                  </text>
                )}
              </g>
            );
          })}

          {/* Renderizar nodos */}
          {nodosConPosicion.map((nodo) => (
            <g
              key={nodo.id}
              onMouseEnter={() => setHoveredNode(nodo.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onMouseDown={(e) => handleMouseDown(nodo.id, e)}
              onClick={() => handleNodeClick(nodo)}
              style={{ cursor: nodo.type === "Externo" ? "pointer" : draggingNode === nodo.id ? "grabbing" : "grab" }}
            >
              <circle
                cx={nodo.x}
                cy={nodo.y}
                r={nodo.isCentral ? NODE_RADIUS * 1.3 : NODE_RADIUS}
                fill={getNodeColor(nodo.type)}
                stroke={hoveredNode === nodo.id ? "#1f2937" : "#ffffff"}
                strokeWidth={hoveredNode === nodo.id ? 3 : 2}
              />
              
              {/* Label del nodo */}
              <text
                x={nodo.x}
                y={nodo.y! + NODE_RADIUS + 15}
                textAnchor="middle"
                fill="#1f2937"
                fontSize="11"
                fontWeight="500"
                style={{ pointerEvents: "none" }}
              >
                {nodo.label.length > 20 ? nodo.label.substring(0, 18) + "..." : nodo.label}
              </text>

              {/* Icono de info para nodos coincidentes */}
              {nodo.personaId && (
                <circle
                  cx={nodo.x! + NODE_RADIUS - 5}
                  cy={nodo.y! - NODE_RADIUS + 5}
                  r="8"
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              )}
            </g>
          ))}
        </svg>

        {/* Tooltip flotante */}
        {hoveredNode && (
          <div
            className="absolute bg-black text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
            style={{
              left: nodosConPosicion.find((n) => n.id === hoveredNode)?.x || 0,
              top: (nodosConPosicion.find((n) => n.id === hoveredNode)?.y || 0) - 50,
            }}
          >
            {nodosConPosicion.find((n) => n.id === hoveredNode)?.type}
            {nodosConPosicion.find((n) => n.id === hoveredNode)?.type === "Externo" && (
              <div className="text-yellow-300 text-xs">Click para expandir</div>
            )}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded">
          <p className="font-semibold text-blue-900">Total Nodos</p>
          <p className="text-2xl text-blue-700">{nodos.length}</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="font-semibold text-green-900">Total Comunicaciones</p>
          <p className="text-2xl text-green-700">{aristas.length}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <p className="font-semibold text-orange-900">Casos Relacionados</p>
          <p className="text-2xl text-orange-700">
            {nodos.filter((n) => n.type === "Coincidente").length}
          </p>
        </div>
      </div>
    </div>
  );
}
