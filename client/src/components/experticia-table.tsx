import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, Trash2, Search, Plus, ChevronLeft, ChevronRight, BarChart3, CheckCircle, XCircle, Clock, QrCode, Calendar, User, FileText } from "lucide-react";
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-gray-600">Completadas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {experticias.filter(e => e.estado === 'completada').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium text-gray-600">Negativas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {experticias.filter(e => e.estado === 'negativa').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-gray-600">Procesando</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {experticias.filter(e => e.estado === 'procesando').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-gray-600">QR Ausente</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {experticias.filter(e => e.estado === 'qr_ausente').length}
              </p>
            </div>
          </CardContent>
        </Card>
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
        <DialogContent className="max-w-4xl max-h-[75vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Detalles de Experticia</span>
            </DialogTitle>
          </DialogHeader>
          {viewingExperticia && (
            <div className="space-y-6 px-1">
              {/* Información básica */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nº Dictamen</label>
                    <p className="font-mono text-sm md:text-base">{viewingExperticia.numeroDictamen}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expediente</label>
                    <p className="font-mono text-sm md:text-base">{viewingExperticia.expediente}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experto</label>
                    <p className="text-sm md:text-base">{viewingExperticia.experto}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nº Comunicación</label>
                    <p className="font-mono text-sm md:text-base">{viewingExperticia.numeroComunicacion}</p>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Fechas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha Comunicación</label>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{viewingExperticia.fechaComunicacion ? new Date(viewingExperticia.fechaComunicacion).toLocaleDateString('es-ES') : "Sin fecha"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha Respuesta</label>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{viewingExperticia.fechaRespuesta ? new Date(viewingExperticia.fechaRespuesta).toLocaleDateString('es-ES') : "Sin fecha"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles de la experticia */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Detalles de la Experticia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Operador</label>
                    <Badge variant="outline" className="capitalize">
                      {viewingExperticia.operador}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo de Experticia</label>
                    <p className="text-sm md:text-base">{viewingExperticia.tipoExperticia}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estado</label>
                    <Badge className={statusColors[viewingExperticia.estado as keyof typeof statusColors]}>
                      {formatStatus(viewingExperticia.estado)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Uso Horario</label>
                    <p className="text-sm md:text-base">{viewingExperticia.usoHorario || "No especificado"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Motivo</label>
                  <p className="text-gray-800 text-sm md:text-base">{viewingExperticia.motivo}</p>
                </div>
              </div>

              {/* Información del abonado */}
              {(viewingExperticia.abonado || viewingExperticia.datosAbonado) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Información del Abonado</h4>
                  {viewingExperticia.abonado && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Abonado</label>
                      <p className="text-sm md:text-base">{viewingExperticia.abonado}</p>
                    </div>
                  )}
                  {viewingExperticia.datosAbonado && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Datos del Abonado</label>
                      <p className="text-gray-800 text-sm md:text-base">{viewingExperticia.datosAbonado}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Archivo y conclusión */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Documentación y Resultados</h4>
                {viewingExperticia.archivoAdjunto && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Archivo Adjunto</label>
                    <p className="text-sm md:text-base">{viewingExperticia.archivoAdjunto}</p>
                  </div>
                )}
                {viewingExperticia.conclusion && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Conclusión</label>
                    <p className="text-gray-800 text-sm md:text-base">{viewingExperticia.conclusion}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{viewingExperticia.createdAt ? new Date(viewingExperticia.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Última Actualización</label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{viewingExperticia.updatedAt ? new Date(viewingExperticia.updatedAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}