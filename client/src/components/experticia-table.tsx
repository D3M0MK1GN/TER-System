import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { DetailField } from "@/components/ui/detail-field";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Calendar,
  FileText,
  Download,
  Printer,
  MessageSquare,
  Files,
  Bug,
  FilePlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type Experticia } from "@shared/schema";
import { type Permission } from "@/hooks/use-permissions";
import { CombinarArchivosModal } from "./combinar-archivos-modal";

interface ExperticiasTableProps {
  experticias: Experticia[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: any) => void;
  onEdit: (experticia: Experticia) => void;
  onDelete: (id: number) => void;
  onView: (experticia: Experticia) => void;
  onCreateNew: () => void;
  onDuplicate: (experticia: Experticia) => void;
  onExportExcel: () => void;
  loading?: boolean;
  permissions: Permission;
}

const operatorColors = {
  digitel: "bg-red-100 text-red-800",
  movistar: "bg-blue-100 text-blue-800",
  movilnet: "bg-green-100 text-green-800",
};

const statusColors = {
  completada: "bg-green-100 text-green-800",
  negativa: "bg-red-100 text-red-800",
  procesando: "bg-yellow-100 text-yellow-800",
  qr_ausente: "bg-orange-100 text-orange-800",
};

const formatOperator = (operador: string) => {
  const names = {
    digitel: "Digitel",
    movistar: "Movistar",
    movilnet: "Movilnet",
  };
  return names[operador as keyof typeof names] || operador;
};

const formatStatus = (estado: string | null) => {
  if (!estado) return "N/A";
  const names = {
    completada: "Completada",
    negativa: "Negativa",
    procesando: "Procesando",
    qr_ausente: "QR Ausente",
  };
  return names[estado as keyof typeof names] || estado;
};

const statsConfig = [
  {
    estado: "completada",
    label: "Completadas",
    icon: CheckCircle,
    color: "green",
  },
  { estado: "negativa", label: "Negativas", icon: XCircle, color: "red" },
  { estado: "procesando", label: "Procesando", icon: Clock, color: "yellow" },
  { estado: "qr_ausente", label: "QR Ausente", icon: QrCode, color: "orange" },
];

export function ExperticiasTable({
  experticias,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
  onCreateNew,
  onDuplicate,
  onExportExcel,
  loading = false,
  permissions,
}: ExperticiasTableProps) {
  const [filters, setFilters] = useState({
    operador: "all",
    estado: "all",
    tipoExperticia: "all",
    search: "",
  });
  const [viewingExperticia, setViewingExperticia] = useState<Experticia | null>(
    null
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCombinarModalOpen, setIsCombinarModalOpen] = useState(false);

  // Función para imprimir el reporte
  const handlePrint = () => {
    window.print();
  };

  // Función para generar documento Word de experticia
  const handleGenerateDocument = async () => {
    if (!viewingExperticia) return;

    try {
      const response = await fetch(
        `/api/plantillas-word/experticia/${viewingExperticia.tipoExperticia}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(viewingExperticia),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `experticia-${viewingExperticia.numeroDictamen}.docx`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        console.error("Error generando documento");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard icon={BarChart3} label="Total" count={total} color="blue" />
        {statsConfig.map((stat) => (
          <StatCard
            key={stat.estado}
            icon={stat.icon}
            label={stat.label}
            count={experticias.filter((e) => e.estado === stat.estado).length}
            color={stat.color}
          />
        ))}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-xl font-semibold">
              Gestión de Experticias
            </CardTitle>
            <div className="flex gap-2">
              {permissions.canManageUsers && (
                <Button
                  onClick={onExportExcel}
                  variant="outline"
                  className="bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              )}
              {permissions.canManageUsers && (
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Experticia
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por N° dictamen o expediente..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.tipoExperticia}
              onValueChange={(value) =>
                handleFilterChange(
                  "tipoExperticia",
                  value === "all" ? "" : value
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                sideOffset={4}
                alignOffset={0}
                avoidCollisions={false}
              >
                <SelectItem value="all">
                  Todos los tipos de experticia
                </SelectItem>
                <SelectItem value="determinar_contacto_frecuente">
                  Determinar contacto frecuente
                </SelectItem>
                <SelectItem value="identificar_numeros_bts">
                  Identificar números que se conectan a la BTS
                </SelectItem>
                <SelectItem value="identificar_radio_bases_bts">
                  Identificar Radio Bases (BTS)
                </SelectItem>
                <SelectItem value="determinar_ubicacion_llamadas">
                  Determinar ubicación mediante registros de llamadas
                </SelectItem>
                <SelectItem value="determinar_ubicacion_trazas">
                  Determinar ubicación mediante registros de trazas telefónicas
                </SelectItem>
                <SelectItem value="determinar_contaminacion_equipo_imei">
                  Determinar contaminación de equipo (IMEI)
                </SelectItem>
                <SelectItem value="identificar_numeros_comun_bts">
                  Identificar números en común en dos o más Radio Base (BTS)
                </SelectItem>
                <SelectItem value="identificar_numeros_desconectan_bts">
                  Identificar números que se desconectan de la Radio Base (BTS)
                  después del hecho
                </SelectItem>
                <SelectItem value="identificar_numeros_repetidos_bts">
                  Identificar números repetidos en la Radio Base (BTS)
                </SelectItem>
                <SelectItem value="determinar_numero_internacional">
                  Determinar número internacional
                </SelectItem>
                <SelectItem value="identificar_linea_sim_card">
                  Identificar línea mediante SIM CARD
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.operador}
              onValueChange={(value) =>
                handleFilterChange("operador", value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los operadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los operadores</SelectItem>
                <SelectItem value="digitel">Digitel</SelectItem>
                <SelectItem value="movistar">Movistar</SelectItem>
                <SelectItem value="movilnet">Movilnet</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.estado}
              onValueChange={(value) =>
                handleFilterChange("estado", value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="negativa">Negativa</SelectItem>
                <SelectItem value="procesando">Procesando</SelectItem>
                <SelectItem value="qr_ausente">QR Ausente</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-600">
              {loading ? "Cargando..." : ""}
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Dictamen</TableHead>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Tipo Experticia</TableHead>
                  <TableHead>Nº Comunicación</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experticias.map((experticia) => (
                  <TableRow key={experticia.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">
                          {experticia.numeroDictamen}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {experticia.expediente}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          operatorColors[experticia.operador] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {formatOperator(experticia.operador)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <span className="font-medium truncate">
                          {experticia.tipoExperticia}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {experticia.numeroComunicacion}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {experticia.fechaComunicacion || "Sin fecha"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[
                            experticia.estado as keyof typeof statusColors
                          ]
                        }
                      >
                        {formatStatus(experticia.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingExperticia(experticia)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {permissions.canManageUsers && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDuplicate(experticia)}
                              title="Duplicar Experticia"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <FilePlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(experticia)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(experticia.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                {Math.min(currentPage * pageSize, total)} de {total} experticias
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog
        open={!!viewingExperticia}
        onOpenChange={() => setViewingExperticia(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-x-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Detalles de Experticia</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="no-print"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Reporte
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDocument}
                  className="no-print"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Documento
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewingExperticia && (
            <div className="space-y-6 px-6 pb-6 max-h-[60vh] overflow-y-auto">
              {/* Información básica */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Información Básica
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField
                    label="Nº Dictamen"
                    value={viewingExperticia.numeroDictamen}
                    isMono
                  />
                  <DetailField
                    label="Expediente"
                    value={viewingExperticia.expediente}
                    isMono
                  />
                  <DetailField
                    label="Experto"
                    value={viewingExperticia.experto}
                  />
                  <DetailField
                    label="Nº Comunicación"
                    value={viewingExperticia.numeroComunicacion}
                    isMono
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Fechas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField
                    label="Fecha Comunicación"
                    value={viewingExperticia.fechaComunicacion?.toString()}
                    isDate
                  />
                  <DetailField
                    label="Fecha Respuesta"
                    value={viewingExperticia.fechaRespuesta?.toString()}
                    isDate
                  />
                </div>
              </div>

              {/* Detalles de la experticia */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Detalles de la Experticia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField
                    label="Operador"
                    value={viewingExperticia.operador}
                    isBadge
                    badgeVariant="outline"
                    badgeClassName="capitalize"
                  />
                  <DetailField
                    label="Tipo de Experticia"
                    value={viewingExperticia.tipoExperticia}
                  />
                  <DetailField
                    label="Estado"
                    value={formatStatus(viewingExperticia.estado)}
                    isBadge
                    badgeClassName={
                      statusColors[
                        viewingExperticia.estado as keyof typeof statusColors
                      ]
                    }
                  />
                </div>
                <DetailField label="Motivo" value={viewingExperticia.motivo} />
              </div>

              {/* Información del abonado */}
              {(viewingExperticia.abonado ||
                viewingExperticia.datosAbonado) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Información del Abonado
                  </h4>
                  <div className="space-y-4">
                    {viewingExperticia.abonado && (
                      <DetailField
                        label="Abonado"
                        value={viewingExperticia.abonado}
                      />
                    )}
                    {viewingExperticia.datosAbonado && (
                      <DetailField
                        label="Datos del Abonado"
                        value={viewingExperticia.datosAbonado}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Archivo y conclusión */}
              {(viewingExperticia.archivoAdjunto ||
                viewingExperticia.conclusion) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Documentación y Resultados
                  </h4>
                  <div className="space-y-4">
                    {viewingExperticia.archivoAdjunto && (
                      <DetailField
                        label="Archivo Adjunto"
                        value={viewingExperticia.archivoAdjunto}
                      />
                    )}
                    {viewingExperticia.conclusion && (
                      <DetailField
                        label="Conclusión"
                        value={viewingExperticia.conclusion}
                      />
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Fecha de Creación"
                  value={viewingExperticia.createdAt?.toString()}
                  isDate
                />
                <DetailField
                  label="Última Actualización"
                  value={viewingExperticia.updatedAt?.toString()}
                  isDate
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Burbuja flotante con menú */}
      <div className="fixed bottom-4 right-3 z-50">
        {/* Menú desplegable */}
        {isMenuOpen && (
          <div
            className="absolute bottom-12 right-5 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-56 mb-2"
            data-testid="menu-flotante"
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              data-testid="button-chat"
            >
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Chat</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsCombinarModalOpen(true);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              data-testid="button-combinar-archivos"
            >
              <Files className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Combinar Archivos</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-purple-100 bg-purple-50 flex items-center space-x-3 transition-colors relative"
              data-testid="button-rastrear"
            >
              <div className="relative">
                <Bug className="h-5 w-5 text-red-600 relative z-10" />
                <div className="absolute inset-0 opacity-20 ">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      fill="currentColor"
                      className="text-gray-400"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      className="text-gray-400"
                      fill="none"
                      strokeWidth="2"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      className="text-gray-400"
                      fill="none"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-sm font-medium">Rastrear (Araña)</span>
            </button>
          </div>
        )}

        {/* Botón de burbuja */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110"
          data-testid="button-menu-flotante"
        >
          <Plus
            className={`h-6 w-6 transition-transform ${
              isMenuOpen ? "rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <CombinarArchivosModal
        isOpen={isCombinarModalOpen}
        onClose={() => setIsCombinarModalOpen(false)}
      />
    </div>
  );
}
