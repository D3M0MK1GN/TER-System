import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, Mail, Trash2, Search, Plus, ChevronLeft, ChevronRight, Printer, Calendar, User, FileText, Building, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type Solicitud } from "@shared/schema";

interface RequestTableProps {
  solicitudes: Solicitud[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: any) => void;
  onEdit: (solicitud: Solicitud) => void;
  onDelete: (id: number) => void;
  onView: (solicitud: Solicitud) => void;
  onCreateNew: () => void;
  loading?: boolean;
}

const operatorColors = {
  movistar: "bg-blue-100 text-blue-800",
  claro: "bg-green-100 text-green-800",
  entel: "bg-red-100 text-red-800",
  bitel: "bg-purple-100 text-purple-800",
  otros: "bg-gray-100 text-gray-800",
};

const statusColors = {
  pendiente: "bg-yellow-100 text-yellow-800",
  enviada: "bg-blue-100 text-blue-800",
  respondida: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
};

const formatOperator = (operador: string) => {
  const names = {
    movistar: "Movistar",
    claro: "Claro",
    entel: "Entel",
    bitel: "Bitel",
    otros: "Otros",
  };
  return names[operador as keyof typeof names] || operador;
};

const formatStatus = (estado: string) => {
  const names = {
    pendiente: "Pendiente",
    enviada: "Enviada",
    respondida: "Respondida",
    rechazada: "Rechazada",
  };
  return names[estado as keyof typeof names] || estado;
};

const formatTipoExperticia = (tipo: string) => {
  const names = {
    analisis_radioespectro: "Análisis de Radioespectro",
    identificacion_bts: "Identificación BTS",
    analisis_trafico: "Análisis de Tráfico",
    localizacion_antenas: "Localización de Antenas",
    analisis_cobertura: "Análisis de Cobertura",
    otros: "Otros",
  };
  return names[tipo as keyof typeof names] || tipo;
};

export function RequestTable({
  solicitudes,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
  onCreateNew,
  loading,
}: RequestTableProps) {
  const [filters, setFilters] = useState({
    operador: "",
    estado: "",
    tipoExperticia: "",
    search: "",
  });

  const [selectValues, setSelectValues] = useState({
    operador: "todos",
    estado: "todos", 
    tipoExperticia: "todos",
  });

  const [viewingSolicitud, setViewingSolicitud] = useState<Solicitud | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    // Actualizar valor del select
    setSelectValues(prev => ({ ...prev, [key]: value }));
    
    // Convertir "todos" a string vacío para el filtro
    const filterValue = value === "todos" ? "" : value;
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleView = (solicitud: Solicitud) => {
    setViewingSolicitud(solicitud);
  };

  const handlePrint = () => {
    if (viewingSolicitud) {
      window.print();
    }
  };

  const formatExpertiseType = (tipo: string) => {
    const types = {
      analisis_radioespectro: "Análisis de Radioespectro",
      identificacion_bts: "Identificación BTS",
      analisis_trafico: "Análisis de Tráfico",
      localizacion_antenas: "Localización de Antenas",
      analisis_cobertura: "Análisis de Cobertura",
      otros: "Otros",
    };
    return types[tipo as keyof typeof types] || tipo;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Solicitudes</h2>
        <Button onClick={onCreateNew} className="bg-primary text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operador
              </label>
              <Select
                value={selectValues.operador}
                onValueChange={(value) => handleFilterChange("operador", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="movistar">Movistar</SelectItem>
                  <SelectItem value="claro">Claro</SelectItem>
                  <SelectItem value="entel">Entel</SelectItem>
                  <SelectItem value="bitel">Bitel</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <Select
                value={selectValues.estado}
                onValueChange={(value) => handleFilterChange("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="respondida">Respondida</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Experticia
              </label>
              <Select
                value={selectValues.tipoExperticia}
                onValueChange={(value) => handleFilterChange("tipoExperticia", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="analisis_radioespectro">Análisis de Radioespectro</SelectItem>
                  <SelectItem value="identificacion_bts">Identificación BTS</SelectItem>
                  <SelectItem value="analisis_trafico">Análisis de Tráfico</SelectItem>
                  <SelectItem value="localizacion_antenas">Localización de Antenas</SelectItem>
                  <SelectItem value="analisis_cobertura">Análisis de Cobertura</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <Input
                placeholder="Nº Solicitud o Expediente"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nº Solicitud</TableHead>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Tipo Experticia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Cargando solicitudes...
                    </TableCell>
                  </TableRow>
                ) : solicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No se encontraron solicitudes
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitudes.map((solicitud) => (
                    <TableRow key={solicitud.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{solicitud.id}</TableCell>
                      <TableCell>{solicitud.numeroSolicitud}</TableCell>
                      <TableCell>{solicitud.numeroExpediente}</TableCell>
                      <TableCell>
                        <Badge
                          className={operatorColors[solicitud.operador] || "bg-gray-100 text-gray-800"}
                        >
                          {formatOperator(solicitud.operador)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTipoExperticia(solicitud.tipoExperticia)}</TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[solicitud.estado || "pendiente"] || "bg-gray-100 text-gray-800"}
                        >
                          {formatStatus(solicitud.estado || "pendiente")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {solicitud.fechaSolicitud
                          ? new Date(solicitud.fechaSolicitud).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(solicitud)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(solicitud)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Enviar correo"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(solicitud.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between border-t">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, total)}
                  </span>{" "}
                  de <span className="font-medium">{total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      onClick={() => onPageChange(i + 1)}
                      className="px-4 py-2"
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Visualización */}
      <Dialog open={!!viewingSolicitud} onOpenChange={(open) => !open && setViewingSolicitud(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalles de la Solicitud</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePrint}
                className="no-print"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Reporte
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {viewingSolicitud && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Número de Solicitud</p>
                      <p className="text-lg font-semibold text-gray-900">{viewingSolicitud.numeroSolicitud}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Número de Expediente</p>
                      <p className="text-lg font-semibold text-gray-900">{viewingSolicitud.numeroExpediente}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fecha de Creación</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {viewingSolicitud.createdAt ? new Date(viewingSolicitud.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fiscal</p>
                      <p className="text-lg font-semibold text-gray-900">{viewingSolicitud.fiscal || 'No asignado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Operador</p>
                      <Badge className={operatorColors[viewingSolicitud.operador as keyof typeof operatorColors]}>
                        {formatOperator(viewingSolicitud.operador)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-teal-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Estado</p>
                      <Badge className={statusColors[viewingSolicitud.estado as keyof typeof statusColors]}>
                        {formatStatus(viewingSolicitud.estado || 'pendiente')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Detalles Técnicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles Técnicos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Tipo de Experticia</p>
                    <p className="text-gray-900">{formatExpertiseType(viewingSolicitud.tipoExperticia)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Coordinación</p>
                    <p className="text-gray-900">{viewingSolicitud.coordinacionSolicitante}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Descripción</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{viewingSolicitud.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Información de Línea</p>
                    <p className="text-gray-900">{viewingSolicitud.informacionLinea || 'No disponible'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Fecha de Actualización</p>
                    <p className="text-gray-900">
                      {viewingSolicitud.updatedAt ? new Date(viewingSolicitud.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'No disponible'}
                    </p>
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
