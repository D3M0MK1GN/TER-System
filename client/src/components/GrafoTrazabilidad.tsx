import { useEffect, useRef, useState } from "react";
import {
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  X,
  Download,
  Upload,
  User,
  Users,
  UserX,
  Skull,
  Smartphone,
  Phone,
  Laptop,
  FolderOpen,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Nodo {
  id: string;
  label: string;
  type: "Principal" | "Coincidente" | "Externo";
  personaId: number | null;
  isCentral: boolean;
  iconoTipo?: string | null;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  metadata?: {
    cedula?: string;
    delito?: string;
    expediente?: string;
    nombreCompleto?: string;
  };
}

interface Arista {
  id: number;
  from: string;
  to: string;
  title: string;
  weight: number;
  transactionType: string;
  metadata?: {
    fecha?: string;
    hora?: string;
    segundos?: number;
    latitud?: string;
    longitud?: string;
    direccion?: string;
    imei1A?: string;
    imei2A?: string;
    imei1B?: string;
    imei2B?: string;
  };
}

interface GrafoTrazabilidadProps {
  nodos: Nodo[];
  aristas: Arista[];
  onNodeClick?: (nodo: Nodo) => void;
}

export function GrafoTrazabilidad({
  nodos,
  aristas,
  onNodeClick,
}: GrafoTrazabilidadProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nodosConPosicion, setNodosConPosicion] = useState<Nodo[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Estados para menú contextual
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    showPrincipal: true,
    showCoincidente: true,
    showExterno: true,
    showLlamadas: true,
    showSMS: true,
  });

  const WIDTH = 1000;
  const HEIGHT = 700;
  const NODE_RADIUS = 30;

  // Inicializar posiciones de nodos con un layout mejorado
  useEffect(() => {
    if (nodos.length === 0) return;

    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const radius = Math.min(WIDTH, HEIGHT) / 3;

    const nodosInicializados = nodos.map((nodo, index) => {
      if (nodo.isCentral) {
        return { ...nodo, x: centerX, y: centerY, vx: 0, vy: 0 };
      } else {
        const angle = (index / (nodos.length - 1)) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return { ...nodo, x, y, vx: 0, vy: 0 };
      }
    });

    setNodosConPosicion(nodosInicializados);
  }, [nodos]);

  // Simulación de fuerza para mejorar el layout
  useEffect(() => {
    if (nodosConPosicion.length === 0) return;

    const interval = setInterval(() => {
      setNodosConPosicion((prevNodos) => {
        const newNodos = prevNodos.map((nodo) => ({ ...nodo }));

        // Fuerzas de repulsión entre nodos
        for (let i = 0; i < newNodos.length; i++) {
          for (let j = i + 1; j < newNodos.length; j++) {
            const dx = newNodos[j].x! - newNodos[i].x!;
            const dy = newNodos[j].y! - newNodos[i].y!;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120 && distance > 0) {
              const force = ((120 - distance) / distance) * 0.5;
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

        // Fuerzas de atracción en aristas
        aristas.forEach((arista) => {
          const source = newNodos.find((n) => n.id === arista.from);
          const target = newNodos.find((n) => n.id === arista.to);

          if (source && target) {
            const dx = target.x! - source.x!;
            const dy = target.y! - source.y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const optimalDistance = 180;

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
            nodo.vx = (nodo.vx || 0) * 0.85;
            nodo.vy = (nodo.vy || 0) * 0.85;

            nodo.x = Math.max(
              NODE_RADIUS * 2,
              Math.min(WIDTH - NODE_RADIUS * 2, nodo.x)
            );
            nodo.y = Math.max(
              NODE_RADIUS * 2,
              Math.min(HEIGHT - NODE_RADIUS * 2, nodo.y)
            );
          }
        });

        return newNodos;
      });
    }, 50);

    setTimeout(() => clearInterval(interval), 6000);

    return () => clearInterval(interval);
  }, [nodosConPosicion.length, aristas, draggingNode]);

  // Zoom con rueda del ratón
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prevZoom) => Math.max(0.3, Math.min(3, prevZoom + delta)));
  };

  // Inicio de arrastre de nodo
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingNode(nodeId);
  };

  // Inicio de Pan del canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggingNode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  // Movimiento del ratón
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;

      setNodosConPosicion((prev) =>
        prev.map((nodo) =>
          nodo.id === draggingNode ? { ...nodo, x, y, vx: 0, vy: 0 } : nodo
        )
      );
    } else if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  // Vista Fit - Ajustar todos los nodos en pantalla
  const handleFitView = () => {
    if (nodosConPosicion.length === 0) return;

    const padding = 80;
    const minX = Math.min(...nodosConPosicion.map((n) => n.x || 0));
    const maxX = Math.max(...nodosConPosicion.map((n) => n.x || 0));
    const minY = Math.min(...nodosConPosicion.map((n) => n.y || 0));
    const maxY = Math.max(...nodosConPosicion.map((n) => n.y || 0));

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scaleX = WIDTH / contentWidth;
    const scaleY = HEIGHT / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(newZoom);
    setOffset({
      x: WIDTH / 2 - centerX * newZoom,
      y: HEIGHT / 2 - centerY * newZoom,
    });
  };

  const getNodeColor = (type: string): string => {
    switch (type) {
      case "Principal":
        return "#ef4444";
      case "Coincidente":
        return "#f97316";
      case "Externo":
        return "#9ca3af";
      default:
        return "#6b7280";
    }
  };

  const handleNodeClick = (nodo: Nodo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(nodo.id);
    setSelectedEdge(null);

    if (nodo.type === "Externo" && onNodeClick) {
      onNodeClick(nodo);
    }
  };

  const handleEdgeClick = (aristaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdge(aristaId);
    setSelectedNode(null);
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  // Obtener nodos y aristas conectadas al nodo seleccionado
  const getConnectedElements = (nodeId: string) => {
    const connectedNodes = new Set<string>();
    const connectedEdges = new Set<number>();

    aristas.forEach((arista) => {
      if (arista.from === nodeId || arista.to === nodeId) {
        connectedEdges.add(arista.id);
        connectedNodes.add(arista.from);
        connectedNodes.add(arista.to);
      }
    });

    return { connectedNodes, connectedEdges };
  };

  // Manejar clic derecho en nodo
  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  // Asignar icono a un nodo
  const handleAsignarIcono = async (iconoTipo: string) => {
    if (!contextMenu) return;

    try {
      const response = await fetch("/api/asignar-icono", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          numero: contextMenu.nodeId,
          iconoTipo: iconoTipo,
        }),
      });

      if (response.ok) {
        toast({
          title: "Icono asignado",
          description: `Se asignó el icono ${iconoTipo} correctamente`,
        });

        // Actualizar el nodo localmente
        setNodosConPosicion((prev) =>
          prev.map((nodo) =>
            nodo.id === contextMenu.nodeId
              ? { ...nodo, iconoTipo: iconoTipo }
              : nodo
          )
        );
      } else {
        toast({
          title: "Error",
          description: "No se pudo asignar el icono",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al asignar icono:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar el icono",
        variant: "destructive",
      });
    } finally {
      setContextMenu(null);
    }
  };

  // Exportar análisis
  const handleExportar = async () => {
    const expediente = nodos[0]?.metadata?.expediente;
    if (!expediente) {
      toast({
        title: "Error",
        description: "No se encontró información del expediente",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/exportar-analisis/${expediente}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analisis_${expediente}_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Exportación exitosa",
          description: "Archivo CSV descargado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo exportar el análisis",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al exportar el análisis",
        variant: "destructive",
      });
    }
  };

  // Importar análisis
  const handleImportar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/importar-analisis", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Importación exitosa",
          description: `Se actualizaron ${data.actualizados} registros`,
        });

        // Recargar la página o actualizar los datos
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "No se pudo importar el archivo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al importar:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al importar el archivo",
        variant: "destructive",
      });
    }

    // Limpiar el input
    e.target.value = "";
  };

  // Obtener el icono para un nodo
  const getNodeIcon = (
    iconoTipo: string | null | undefined
  ): React.ReactNode => {
    const iconProps = { size: 20, color: "white" };

    switch (iconoTipo) {
      case "Hombre":
        return <User {...iconProps} />;
      case "Mujer":
        return <Users {...iconProps} />;
      case "Anonimo":
        return <UserX {...iconProps} />;
      case "Estafador":
        return <Skull {...iconProps} />;
      case "Telefono_Movil":
        return <Smartphone {...iconProps} />;
      case "Telefono_Fijo":
        return <Phone {...iconProps} />;
      case "Computadora":
        return <Laptop {...iconProps} />;
      case "Expediente":
        return <FolderOpen {...iconProps} />;
      case "Antena":
        return <Radio {...iconProps} />;
      default:
        return null;
    }
  };

  const { connectedNodes, connectedEdges } = selectedNode
    ? getConnectedElements(selectedNode)
    : { connectedNodes: new Set(), connectedEdges: new Set() };

  // Filtrar nodos y aristas según filtros
  const nodosFiltrados = nodosConPosicion.filter((nodo) => {
    if (nodo.type === "Principal" && !filters.showPrincipal) return false;
    if (nodo.type === "Coincidente" && !filters.showCoincidente) return false;
    if (nodo.type === "Externo" && !filters.showExterno) return false;
    return true;
  });

  const aristasFiltradas = aristas.filter((arista) => {
    const isLlamada = arista.transactionType?.toLowerCase().includes("llamada");
    const isSMS = arista.transactionType?.toLowerCase().includes("sms");

    if (isLlamada && !filters.showLlamadas) return false;
    if (isSMS && !filters.showSMS) return false;

    // Solo mostrar aristas cuyos nodos estén visibles
    const fromVisible = nodosFiltrados.some((n) => n.id === arista.from);
    const toVisible = nodosFiltrados.some((n) => n.id === arista.to);
    return fromVisible && toVisible;
  });

  const selectedNodeData = selectedNode
    ? nodosConPosicion.find((n) => n.id === selectedNode)
    : null;
  const selectedEdgeData = selectedEdge
    ? aristas.find((a) => a.id === selectedEdge)
    : null;

  return (
    <div className="flex gap-4">
      {/* Grafo principal */}
      <div className="flex-1 space-y-4">
        {/* Controles superiores */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Principal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Coincidente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span>Externo</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportar}
              data-testid="button-exportar-config"
              title="Exportar configuración del grafo a CSV"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportar}
              data-testid="button-importar-config"
              title="Importar configuración del grafo desde CSV"
            >
              <Upload className="h-4 w-4 mr-1" />
              Importar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <Button
              size="sm"
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
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
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFitView}
              data-testid="button-fit-view"
              title="Ajustar vista"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Filtros de Visualización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Tipos de Nodo
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-principal"
                      checked={filters.showPrincipal}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, showPrincipal: !!checked })
                      }
                      data-testid="checkbox-filter-principal"
                    />
                    <label htmlFor="filter-principal" className="text-sm">
                      Nodos Principales
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-coincidente"
                      checked={filters.showCoincidente}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, showCoincidente: !!checked })
                      }
                      data-testid="checkbox-filter-coincidente"
                    />
                    <label htmlFor="filter-coincidente" className="text-sm">
                      Nodos Coincidentes
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-externo"
                      checked={filters.showExterno}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, showExterno: !!checked })
                      }
                      data-testid="checkbox-filter-externo"
                    />
                    <label htmlFor="filter-externo" className="text-sm">
                      Nodos Externos
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Tipos de Comunicación
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-llamadas"
                      checked={filters.showLlamadas}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, showLlamadas: !!checked })
                      }
                      data-testid="checkbox-filter-llamadas"
                    />
                    <label htmlFor="filter-llamadas" className="text-sm">
                      Llamadas
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-sms"
                      checked={filters.showSMS}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, showSMS: !!checked })
                      }
                      data-testid="checkbox-filter-sms"
                    />
                    <label htmlFor="filter-sms" className="text-sm">
                      SMS
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Canvas del Grafo */}
        <div
          ref={canvasRef}
          className="border rounded-lg bg-white overflow-hidden relative cursor-grab active:cursor-grabbing"
          style={{ width: WIDTH, height: HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        >
          <svg
            ref={svgRef}
            width={WIDTH}
            height={HEIGHT}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <defs>
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
              <marker
                id="arrowhead-highlighted"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
              </marker>
            </defs>

            {/* Renderizar aristas */}
            {aristasFiltradas.map((arista) => {
              const source = nodosFiltrados.find((n) => n.id === arista.from);
              const target = nodosFiltrados.find((n) => n.id === arista.to);

              if (!source || !target) return null;

              const dx = target.x! - source.x!;
              const dy = target.y! - source.y!;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const targetX = target.x! - (dx / distance) * NODE_RADIUS;
              const targetY = target.y! - (dy / distance) * NODE_RADIUS;

              const isHighlighted = connectedEdges.has(arista.id);
              const isSelected = selectedEdge === arista.id;

              return (
                <g key={arista.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={targetX}
                    y2={targetY}
                    stroke={
                      isSelected
                        ? "#3b82f6"
                        : isHighlighted
                        ? "#60a5fa"
                        : "#d1d5db"
                    }
                    strokeWidth={
                      isSelected
                        ? arista.weight + 2
                        : isHighlighted
                        ? arista.weight + 1
                        : Math.max(1, arista.weight / 2)
                    }
                    markerEnd={
                      isSelected || isHighlighted
                        ? "url(#arrowhead-highlighted)"
                        : "url(#arrowhead)"
                    }
                    onClick={(e) => handleEdgeClick(arista.id, e)}
                    style={{ cursor: "pointer" }}
                    data-testid={`edge-${arista.id}`}
                  />
                </g>
              );
            })}

            {/* Renderizar nodos */}
            {nodosFiltrados.map((nodo) => {
              const isHighlighted = connectedNodes.has(nodo.id);
              const isSelected = selectedNode === nodo.id;

              return (
                <g
                  key={nodo.id}
                  onMouseEnter={() => setHoveredNode(nodo.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleNodeMouseDown(nodo.id, e)}
                  onClick={(e) => handleNodeClick(nodo, e)}
                  onContextMenu={(e) => handleNodeContextMenu(e, nodo.id)}
                  style={{
                    cursor:
                      nodo.type === "Externo"
                        ? "pointer"
                        : draggingNode === nodo.id
                        ? "grabbing"
                        : "grab",
                  }}
                  data-testid={`node-${nodo.id}`}
                >
                  <circle
                    cx={nodo.x}
                    cy={nodo.y}
                    r={nodo.isCentral ? NODE_RADIUS * 1.3 : NODE_RADIUS}
                    fill={getNodeColor(nodo.type)}
                    stroke={
                      isSelected
                        ? "#1e40af"
                        : isHighlighted
                        ? "#60a5fa"
                        : "#ffffff"
                    }
                    strokeWidth={isSelected ? 4 : isHighlighted ? 3 : 2}
                  />

                  {/* Renderizar icono si existe */}
                  {nodo.iconoTipo && (
                    <foreignObject
                      x={nodo.x! - 10}
                      y={nodo.y! - 10}
                      width="20"
                      height="20"
                      style={{ pointerEvents: "none" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        {getNodeIcon(nodo.iconoTipo)}
                      </div>
                    </foreignObject>
                  )}

                  <text
                    x={nodo.x}
                    y={nodo.y! + NODE_RADIUS + 18}
                    textAnchor="middle"
                    fill="#1f2937"
                    fontSize="12"
                    fontWeight="600"
                    style={{ pointerEvents: "none" }}
                  >
                    {nodo.label.length > 15
                      ? nodo.label.substring(0, 13) + "..."
                      : nodo.label}
                  </text>

                  {nodo.personaId && (
                    <circle
                      cx={nodo.x! + NODE_RADIUS - 8}
                      cy={nodo.y! - NODE_RADIUS + 8}
                      r="10"
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip flotante */}
          {hoveredNode && !selectedNode && (
            <div
              className="absolute bg-black text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none z-10"
              style={{
                left: Math.min(
                  WIDTH - 150,
                  (nodosConPosicion.find((n) => n.id === hoveredNode)?.x || 0) *
                    zoom +
                    offset.x
                ),
                top: Math.max(
                  10,
                  (nodosConPosicion.find((n) => n.id === hoveredNode)?.y || 0) *
                    zoom +
                    offset.y -
                    60
                ),
              }}
            >
              <p className="font-semibold">
                {nodosConPosicion.find((n) => n.id === hoveredNode)?.type}
              </p>
              {nodosConPosicion.find((n) => n.id === hoveredNode)?.type ===
                "Externo" && (
                <p className="text-yellow-300 text-xs">Click para expandir</p>
              )}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <p className="font-semibold text-blue-900">Nodos</p>
            <p className="text-xl text-blue-700">{nodosFiltrados.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="font-semibold text-green-900">Comunicaciones</p>
            <p className="text-xl text-green-700">{aristasFiltradas.length}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <p className="font-semibold text-orange-900">Relacionados</p>
            <p className="text-xl text-orange-700">
              {nodosFiltrados.filter((n) => n.type === "Coincidente").length}
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="font-semibold text-purple-900">Zoom</p>
            <p className="text-xl text-purple-700">{Math.round(zoom * 100)}%</p>
          </div>
        </div>
      </div>

      {/* Panel lateral de detalles */}
      {(selectedNodeData || selectedEdgeData) && (
        <Card className="w-80 h-fit max-h-[700px] overflow-y-auto">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              {selectedNodeData
                ? "Detalles del Nodo"
                : "Detalles de la Comunicación"}
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedNode(null);
                setSelectedEdge(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedNodeData && (
              <>
                <div>
                  <p className="text-xs text-gray-500">Número/ID</p>
                  <p className="font-mono text-sm font-semibold">
                    {selectedNodeData.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <Badge
                    variant={
                      selectedNodeData.type === "Principal"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {selectedNodeData.type}
                  </Badge>
                </div>
                {selectedNodeData.metadata?.nombreCompleto && (
                  <div>
                    <p className="text-xs text-gray-500">Nombre Completo</p>
                    <p className="text-sm font-semibold">
                      {selectedNodeData.metadata.nombreCompleto}
                    </p>
                  </div>
                )}
                {selectedNodeData.metadata?.cedula && (
                  <div>
                    <p className="text-xs text-gray-500">Cédula</p>
                    <p className="text-sm">
                      {selectedNodeData.metadata.cedula}
                    </p>
                  </div>
                )}
                {selectedNodeData.metadata?.expediente && (
                  <div>
                    <p className="text-xs text-gray-500">Expediente</p>
                    <p className="text-sm">
                      {selectedNodeData.metadata.expediente}
                    </p>
                  </div>
                )}
                {selectedNodeData.metadata?.delito && (
                  <div>
                    <p className="text-xs text-gray-500">Delito</p>
                    <p className="text-sm font-semibold text-red-600">
                      {selectedNodeData.metadata.delito}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Conexiones</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {connectedEdges.size}
                  </p>
                </div>
              </>
            )}

            {selectedEdgeData && (
              <>
                <div>
                  <p className="text-xs text-gray-500">De</p>
                  <p className="font-mono text-sm">{selectedEdgeData.from}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Para</p>
                  <p className="font-mono text-sm">{selectedEdgeData.to}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Transacción</p>
                  <Badge>{selectedEdgeData.transactionType}</Badge>
                </div>
                {selectedEdgeData.metadata?.fecha && (
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="text-sm">{selectedEdgeData.metadata.fecha}</p>
                  </div>
                )}
                {selectedEdgeData.metadata?.hora && (
                  <div>
                    <p className="text-xs text-gray-500">Hora</p>
                    <p className="text-sm">{selectedEdgeData.metadata.hora}</p>
                  </div>
                )}
                {selectedEdgeData.metadata?.segundos !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500">Duración</p>
                    <p className="text-sm">
                      {selectedEdgeData.metadata.segundos} segundos
                    </p>
                  </div>
                )}
                {selectedEdgeData.metadata?.direccion && (
                  <div>
                    <p className="text-xs text-gray-500">Dirección</p>
                    <p className="text-sm">
                      {selectedEdgeData.metadata.direccion}
                    </p>
                  </div>
                )}
                {selectedEdgeData.metadata?.latitud &&
                  selectedEdgeData.metadata?.longitud && (
                    <div>
                      <p className="text-xs text-gray-500">Coordenadas GPS</p>
                      <p className="text-xs font-mono">
                        {selectedEdgeData.metadata.latitud},{" "}
                        {selectedEdgeData.metadata.longitud}
                      </p>
                    </div>
                  )}
                {selectedEdgeData.metadata?.imei1A && (
                  <div>
                    <p className="text-xs text-gray-500">IMEI Abonado A</p>
                    <p className="text-xs font-mono">
                      {selectedEdgeData.metadata.imei1A}
                    </p>
                    {selectedEdgeData.metadata?.imei2A && (
                      <p className="text-xs font-mono">
                        {selectedEdgeData.metadata.imei2A}
                      </p>
                    )}
                  </div>
                )}
                {selectedEdgeData.metadata?.imei1B && (
                  <div>
                    <p className="text-xs text-gray-500">IMEI Abonado B</p>
                    <p className="text-xs font-mono">
                      {selectedEdgeData.metadata.imei1B}
                    </p>
                    {selectedEdgeData.metadata?.imei2B && (
                      <p className="text-xs font-mono">
                        {selectedEdgeData.metadata.imei2B}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Peso/Frecuencia</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedEdgeData.weight}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Menú contextual para asignar iconos */}
      {contextMenu && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 1000,
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "8px 0",
              minWidth: "200px",
            }}
            data-testid="context-menu-iconos"
          >
            <div
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#6b7280",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Asignar Icono
            </div>
            <div style={{ padding: "4px 0" }}>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#9ca3af",
                }}
              >
                IDENTIDAD
              </div>
              <button
                onClick={() => handleAsignarIcono("Hombre")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-hombre"
              >
                <User size={16} /> Hombre
              </button>
              <button
                onClick={() => handleAsignarIcono("Mujer")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-mujer"
              >
                <Users size={16} /> Mujer
              </button>
              <button
                onClick={() => handleAsignarIcono("Anonimo")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-anonimo"
              >
                <UserX size={16} /> Anónimo
              </button>
              <button
                onClick={() => handleAsignarIcono("Estafador")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-estafador"
              >
                <Skull size={16} /> Estafador
              </button>
              <div
                style={{ borderTop: "1px solid #e5e7eb", margin: "4px 0" }}
              ></div>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#9ca3af",
                }}
              >
                DISPOSITIVO
              </div>
              <button
                onClick={() => handleAsignarIcono("Telefono_Movil")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-telefono-movil"
              >
                <Smartphone size={16} /> Teléfono Móvil
              </button>
              <button
                onClick={() => handleAsignarIcono("Telefono_Fijo")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-telefono-fijo"
              >
                <Phone size={16} /> Teléfono Fijo
              </button>
              <button
                onClick={() => handleAsignarIcono("Computadora")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-computadora"
              >
                <Laptop size={16} /> Computadora
              </button>
              <div
                style={{ borderTop: "1px solid #e5e7eb", margin: "4px 0" }}
              ></div>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#9ca3af",
                }}
              >
                ROL / LUGAR
              </div>
              <button
                onClick={() => handleAsignarIcono("Expediente")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-expediente"
              >
                <FolderOpen size={16} /> Expediente
              </button>
              <button
                onClick={() => handleAsignarIcono("Antena")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 16px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                className="hover:bg-gray-100"
                data-testid="menu-icon-antena"
              >
                <Radio size={16} /> Antena (Radio Base)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
