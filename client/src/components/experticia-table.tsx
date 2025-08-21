import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, Trash2, Search, Plus, ChevronLeft, ChevronRight, Atom, Calendar, User, FileText, Clock } from "lucide-react";
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
  activa: "bg-green-100 text-green-800",
  inactiva: "bg-red-100 text-red-800",
  en_desarrollo: "bg-yellow-100 text-yellow-800",
};

const formatStatus = (estado: string) => {
  const names = {
    activa: "Activa",
    inactiva: "Inactiva",
    en_desarrollo: "En Desarrollo",
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
    categoria: "all",
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Atom className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Atom className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {experticias.filter(e => e.estado === 'activa').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Atom className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">En Desarrollo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {experticias.filter(e => e.estado === 'en_desarrollo').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Atom className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Inactivas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {experticias.filter(e => e.estado === 'inactiva').length}
                </p>
              </div>
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

            <Select value={filters.categoria} onValueChange={(value) => handleFilterChange("categoria", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="telecomunicaciones">Telecomunicaciones</SelectItem>
                <SelectItem value="informatica">Informática</SelectItem>
                <SelectItem value="documentos">Documentos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.estado} onValueChange={(value) => handleFilterChange("estado", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="inactiva">Inactiva</SelectItem>
                <SelectItem value="en_desarrollo">En Desarrollo</SelectItem>
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
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tiempo Estimado</TableHead>
                  <TableHead>Freq. Uso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experticias.map((experticia) => (
                  <TableRow key={experticia.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Atom className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">{experticia.codigo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{experticia.nombre}</p>
                        {experticia.descripcion && (
                          <p className="text-sm text-gray-500 truncate">{experticia.descripcion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{experticia.categoria ?? "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[experticia.estado as keyof typeof statusColors]}>
                        {formatStatus(experticia.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{experticia.tiempoEstimado ?? "No definido"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium">{experticia.frecuenciaUso ?? 0}</span>
                      </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Atom className="h-5 w-5" />
              <span>Detalles de Experticia</span>
            </DialogTitle>
          </DialogHeader>
          {viewingExperticia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Código</label>
                  <p className="font-mono">{viewingExperticia.codigo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <Badge className={statusColors[viewingExperticia.estado as keyof typeof statusColors]}>
                    {formatStatus(viewingExperticia.estado)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Nombre</label>
                <p className="font-medium">{viewingExperticia.nombre}</p>
              </div>

              {viewingExperticia.descripcion && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Descripción</label>
                  <p className="text-gray-800">{viewingExperticia.descripcion}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Categoría</label>
                  <p className="capitalize">{viewingExperticia.categoria ?? "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tiempo Estimado</label>
                  <p>{viewingExperticia.tiempoEstimado ?? "No definido"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Frecuencia de Uso</label>
                  <p>{viewingExperticia.frecuenciaUso ?? 0} veces</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Requiere Documento</label>
                  <p>{viewingExperticia.requiereDocumento ? "Sí" : "No"}</p>
                </div>
              </div>

              {viewingExperticia.responsable && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Responsable</label>
                  <p>{viewingExperticia.responsable}</p>
                </div>
              )}

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