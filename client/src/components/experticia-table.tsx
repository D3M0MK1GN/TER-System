import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { DetailField } from "@/components/ui/detail-field";
import { Eye, Edit, Trash2, Search, Plus, ChevronLeft, ChevronRight, BarChart3, CheckCircle, XCircle, Clock, QrCode, Calendar, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type Experticia } from "@shared/schema";
import { type Permission } from "@/hooks/use-permissions";

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
  loading?: boolean;
  permissions: Permission;
}

const statusColors = {
  completada: "bg-green-100 text-green-800",
  negativa: "bg-red-100 text-red-800",
  procesando: "bg-yellow-100 text-yellow-800",
  qr_ausente: "bg-orange-100 text-orange-800",
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
  { estado: 'completada', label: 'Completadas', icon: CheckCircle, color: 'green' },
  { estado: 'negativa', label: 'Negativas', icon: XCircle, color: 'red' },
  { estado: 'procesando', label: 'Procesando', icon: Clock, color: 'yellow' },
  { estado: 'qr_ausente', label: 'QR Ausente', icon: QrCode, color: 'orange' }
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
  loading = false,
  permissions,
}: ExperticiasTableProps) {
  const [filters, setFilters] = useState({
    operador: "all",
    estado: "all", 
    search: "",
  });
  const [viewingExperticia, setViewingExperticia] = useState<Experticia | null>(null);

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
        <StatCard
          icon={BarChart3}
          label="Total"
          count={total}
          color="blue"
        />
        {statsConfig.map(stat => (
          <StatCard
            key={stat.estado}
            icon={stat.icon}
            label={stat.label}
            count={experticias.filter(e => e.estado === stat.estado).length}
            color={stat.color}
          />
        ))}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-xl font-semibold">Gestión de Experticias</CardTitle>
            {permissions.canManageUsers && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Experticia
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.operador} onValueChange={(value) => handleFilterChange("operador", value === "all" ? "" : value)}>
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

            <Select value={filters.estado} onValueChange={(value) => handleFilterChange("estado", value === "all" ? "" : value)}>
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
              {loading ? "Cargando..." : `${total} experticias encontradas`}
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
                        <span className="font-mono text-sm">{experticia.numeroDictamen}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{experticia.expediente}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {experticia.operador}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <span className="font-medium truncate">{experticia.tipoExperticia}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{experticia.numeroComunicacion}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {experticia.fechaComunicacion 
                            ? new Date(experticia.fechaComunicacion).toLocaleDateString('es-ES')
                            : "Sin fecha"
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[experticia.estado as keyof typeof statusColors]}>
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
      <Dialog open={!!viewingExperticia} onOpenChange={() => setViewingExperticia(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Detalles de Experticia</span>
            </DialogTitle>
          </DialogHeader>
          {viewingExperticia && (
            <div className="space-y-6 px-6 pb-6 max-h-[60vh] overflow-y-auto">
              {/* Información básica */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Nº Dictamen" value={viewingExperticia.numeroDictamen} isMono />
                  <DetailField label="Expediente" value={viewingExperticia.expediente} isMono />
                  <DetailField label="Experto" value={viewingExperticia.experto} />
                  <DetailField label="Nº Comunicación" value={viewingExperticia.numeroComunicacion} isMono />
                </div>
              </div>

              {/* Fechas */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Fechas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Fecha Comunicación" value={viewingExperticia.fechaComunicacion?.toString()} isDate />
                  <DetailField label="Fecha Respuesta" value={viewingExperticia.fechaRespuesta?.toString()} isDate />
                </div>
              </div>

              {/* Detalles de la experticia */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Detalles de la Experticia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField 
                    label="Operador" 
                    value={viewingExperticia.operador} 
                    isBadge 
                    badgeVariant="outline" 
                    badgeClassName="capitalize" 
                  />
                  <DetailField label="Tipo de Experticia" value={viewingExperticia.tipoExperticia} />
                  <DetailField 
                    label="Estado" 
                    value={formatStatus(viewingExperticia.estado)} 
                    isBadge 
                    badgeClassName={statusColors[viewingExperticia.estado as keyof typeof statusColors]} 
                  />
                  <DetailField label="Uso Horario" value={viewingExperticia.usoHorario} />
                </div>
                <DetailField label="Motivo" value={viewingExperticia.motivo} />
              </div>

              {/* Información del abonado */}
              {(viewingExperticia.abonado || viewingExperticia.datosAbonado) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Información del Abonado</h4>
                  <div className="space-y-4">
                    {viewingExperticia.abonado && (
                      <DetailField label="Abonado" value={viewingExperticia.abonado} />
                    )}
                    {viewingExperticia.datosAbonado && (
                      <DetailField label="Datos del Abonado" value={viewingExperticia.datosAbonado} />
                    )}
                  </div>
                </div>
              )}

              {/* Archivo y conclusión */}
              {(viewingExperticia.archivoAdjunto || viewingExperticia.conclusion) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Documentación y Resultados</h4>
                  <div className="space-y-4">
                    {viewingExperticia.archivoAdjunto && (
                      <DetailField label="Archivo Adjunto" value={viewingExperticia.archivoAdjunto} />
                    )}
                    {viewingExperticia.conclusion && (
                      <DetailField label="Conclusión" value={viewingExperticia.conclusion} />
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Fecha de Creación" value={viewingExperticia.createdAt?.toString()} isDate />
                <DetailField label="Última Actualización" value={viewingExperticia.updatedAt?.toString()} isDate />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}