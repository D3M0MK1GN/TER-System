// Seccion de Gestion de Solicitdues
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
import {
  Eye,
  Edit,
  Mail,
  Trash2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Printer,
  Calendar,
  User,
  FileText,
  Building,
  ClipboardList,
  Download,
  Atom,
  FilePlus,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type Solicitud } from "@shared/schema";
import { type Permission } from "@/hooks/use-permissions";

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
  onCreateExperticia: (solicitud: Solicitud) => void;
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
  procesando: "bg-yellow-100 text-yellow-800",
  enviada: "bg-blue-100 text-blue-800",
  respondida: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
};

const formatOperator = (operador: string) => {
  const names = {
    digitel: "Digitel",
    movistar: "Movistar",
    movilnet: "Movilnet",
  };
  return names[operador as keyof typeof names] || operador;
};

const formatStatus = (estado: string) => {
  const names = {
    procesando: "Procesando",
    enviada: "Enviada",
    respondida: "Respondida",
    rechazada: "Rechazada",
  };
  return names[estado as keyof typeof names] || estado;
};
// Diccionario para formatear tipo de experticias en la tabla
const formatTipoExperticia = (tipo: string) => {
  const names = {
    identificar_datos_numero: "Identificar datos de un número",
    determinar_tramite_venta_linea:
      "Determinar dónde fue tramitada la venta de línea",
    determinar_linea_conexion_ip: "Determinar línea telefónica con conexión IP",
    identificar_radio_bases_bts: "Identificar las Radio Bases (BTS)",
    identificar_numeros_duraciones_bts:
      "Identificar números con duraciones específicas en la Radio Base (BTS)",
    determinar_contaminacion_linea: "Determinar contaminación de línea",
    determinar_sim_cards_numero:
      "Determinar SIM CARDS utilizados con un número telefónico",
    determinar_comportamiento_social: "Determinar comportamiento social",
    determinar_numeros_comun: "Determinar números en común",
    determinar_ubicacion_llamadas:
      "Determinar ubicación mediante registros de llamadas",
    determinar_ubicacion_trazas:
      "Determinar ubicación mediante registros de trazas telefónicas",
    determinar_contaminacion_equipo_imei:
      "Determinar contaminación de equipo (IMEI)",
    identificar_numeros_comun_bts:
      "Identificar números en común en dos o más Radio Base (BTS)",
    identificar_numeros_desconectan_bts:
      "Identificar números que se desconectan de la Radio Base (BTS) después del hecho",
    identificar_numeros_repetidos_bts:
      "Identificar números repetidos en la Radio Base (BTS)",
    determinar_numero_internacional: "Determinar número internacional",
    identificar_linea_sim_card: "Identificar línea mediante SIM CARD",
    determinar_contacto_frecuente: "Determinar contactos frecuente",
    Identificar_linea_mediante_cedula_de_identidad:
      "Identificar linea mediante cedula de identidad",
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
  onCreateExperticia,
  onExportExcel,
  loading,
  permissions,
}: RequestTableProps) {
  const [filters, setFilters] = useState({
    operador: "",
    estado: "",
    tipoExperticia: "",
    coordinacion: "",
    search: "",
  });

  const [selectValues, setSelectValues] = useState({
    operador: "todos",
    estado: "todos",
    tipoExperticia: "todos",
    coordinacion: "todos",
  });

  const [viewingSolicitud, setViewingSolicitud] = useState<Solicitud | null>(
    null
  );

  const handleFilterChange = (key: string, value: string) => {
    // Actualizar valor del select
    setSelectValues((prev) => ({ ...prev, [key]: value }));

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

  const handleGenerateDocument = async () => {
    if (!viewingSolicitud) return;

    try {
      // **PASO 1: Generar plantilla Word usando los datos de la solicitud existente**
      const wordPromise = fetch(
        `/api/plantillas-word/by-expertise/${viewingSolicitud.tipoExperticia}/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(viewingSolicitud),
        }
      );

      // **PASO 2: Generar planilla Excel usando los mismos datos de la solicitud**
      const excelPromise = fetch("/api/solicitudes/generate-excel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(viewingSolicitud),
      });

      // **PASO 3: Ejecutar ambas peticiones en paralelo para mejor rendimiento**
      const [wordResponse, excelResponse] = await Promise.all([
        wordPromise,
        excelPromise,
      ]);

      // **PASO 4: Procesar descarga del documento Word**
      if (wordResponse.ok) {
        const blob = await wordResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          wordResponse.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") ||
          `Plantilla_${viewingSolicitud.numeroSolicitud}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (wordResponse.status === 404) {
        console.log(
          "No hay plantilla Word disponible para este tipo de experticia"
        );
      } else {
        console.error(
          "Error generando documento Word:",
          wordResponse.statusText
        );
      }

      // **PASO 5: Procesar descarga de la planilla Excel**
      if (excelResponse.ok) {
        const blob = await excelResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          excelResponse.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") ||
          `PLANILLA_DATOS-${viewingSolicitud.numeroSolicitud}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (excelResponse.status === 404) {
        console.log("No hay plantilla Excel disponible");
      } else {
        console.error(
          "Error generando planilla Excel:",
          excelResponse.statusText
        );
      }
    } catch (error) {
      console.error("Error descargando documentos:", error);
    }
  };

  const formatExpertiseType = (tipo: string) => {
    const types = {
      identificar_datos_numero: "Identificar datos de un número",
      determinar_historicos_trazas_bts:
        "Determinar Históricos de Trazas Telefónicas BTS",
      determinar_linea_conexion_ip:
        "Determinar línea telefónica con conexión IP",
      identificar_radio_bases_bts: "Identificar las Radio Bases (BTS)",
      identificar_numeros_duraciones_bts:
        "Identificar números con duraciones específicas en la Radio Base (BTS)",
      determinar_contaminacion_linea: "Determinar contaminación de línea",
      determinar_sim_cards_numero:
        "Determinar SIM CARDS utilizados con un número telefónico",
      determinar_comportamiento_social: "Determinar comportamiento social",
      determinar_contacto_frecuente: "Determinar Contacto Frecuente",
      determinar_ubicacion_llamadas:
        "Determinar ubicación mediante registros de llamadas",
      determinar_ubicacion_trazas:
        "Determinar ubicación mediante registros de trazas telefónicas",
      determinar_contaminacion_equipo_imei:
        "Determinar contaminación de equipo (IMEI)",
      identificar_numeros_comun_bts:
        "Identificar números en común en dos o más Radio Base (BTS)",
      identificar_numeros_desconectan_bts:
        "Identificar números que se desconectan de la Radio Base (BTS) después del hecho",
      identificar_numeros_repetidos_bts:
        "Identificar números repetidos en la Radio Base (BTS)",
      determinar_numero_internacional: "Determinar número internacional",
      identificar_linea_sim_card: "Identificar línea mediante SIM CARD",
      identificar_cambio_sim_card:
        "Identificar Cambio de SIM CARD y Documentos",
    };
    return types[tipo as keyof typeof types] || tipo;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Gestión de Solicitudes
        </h2>
        <div className="flex gap-2">
          {/* Botón de exportar Excel solo para administradores */}
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
          <Button onClick={onCreateNew} className="bg-primary text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
              permissions.canManageUsers ? "lg:grid-cols-6" : "lg:grid-cols-5"
            }`}
          >
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
                  <SelectItem value="digitel">Digitel</SelectItem>
                  <SelectItem value="movistar">Movistar</SelectItem>
                  <SelectItem value="movilnet">Movilnet</SelectItem>
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
                  <SelectItem value="procesando">Procesando</SelectItem>
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
                onValueChange={(value) =>
                  handleFilterChange("tipoExperticia", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="identificar_datos_numero">
                    Identificar datos de un número
                  </SelectItem>
                  <SelectItem value="Identificar_linea_mediante_cedula_de_identidad">
                    Identificar linea mediante cedula de identidad
                  </SelectItem>
                  <SelectItem value="determinar_historicos_trazas_bts">
                    Determinar Históricos de Trazas Telefónicas BTS
                  </SelectItem>
                  <SelectItem value="determinar_linea_conexion_ip">
                    Determinar línea telefónica con conexión IP
                  </SelectItem>
                  <SelectItem value="identificar_radio_bases_bts">
                    Identificar las Radio Bases (BTS)
                  </SelectItem>
                  <SelectItem value="identificar_numeros_duraciones_bts">
                    Identificar números con duraciones específicas en la Radio
                    Base (BTS)
                  </SelectItem>
                  <SelectItem value="determinar_contaminacion_linea">
                    Determinar contaminación de línea
                  </SelectItem>
                  <SelectItem value="determinar_sim_cards_numero">
                    Determinar SIM CARDS utilizados con un número telefónico
                  </SelectItem>
                  <SelectItem value="determinar_comportamiento_social">
                    Determinar comportamiento social
                  </SelectItem>
                  <SelectItem value="determinar_contacto_frecuente">
                    Determinar Contacto Frecuente
                  </SelectItem>
                  <SelectItem value="determinar_ubicacion_llamadas">
                    Determinar ubicación mediante registros de llamadas
                  </SelectItem>
                  <SelectItem value="determinar_ubicacion_trazas">
                    Determinar ubicación mediante registros de trazas
                    telefónicas
                  </SelectItem>
                  <SelectItem value="determinar_contaminacion_equipo_imei">
                    Determinar contaminación de equipo (IMEI)
                  </SelectItem>
                  <SelectItem value="identificar_numeros_comun_bts">
                    Identificar números en común en dos o más Radio Base (BTS)
                  </SelectItem>
                  <SelectItem value="identificar_numeros_desconectan_bts">
                    Identificar números que se desconectan de la Radio Base
                    (BTS) después del hecho
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
                  <SelectItem value="identificar_cambio_simcard_documentos">
                    Identificar Cambio de SIM CARD y Documentos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de coordinación solo para administradores */}
            {permissions.canManageUsers && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coordinación
                </label>
                <Select
                  value={selectValues.coordinacion}
                  onValueChange={(value) =>
                    handleFilterChange("coordinacion", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="delitos_propiedad">
                      Coordinación de los Delitos Contra la Propiedad
                    </SelectItem>
                    <SelectItem value="delitos_personas">
                      Coordinación de los Delitos Contra las Personas
                    </SelectItem>
                    <SelectItem value="delincuencia_organizada">
                      Coordinación de los Delitos Contra la Delincuencia
                      Organizada
                    </SelectItem>
                    <SelectItem value="delitos_vehiculos">
                      Coordinación de los Delitos Contra el Hurto y Robo de
                      Vehículo Automotor
                    </SelectItem>
                    <SelectItem value="homicidio">Homicidio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
                      <TableCell className="font-medium">
                        {solicitud.id}
                      </TableCell>
                      <TableCell>{solicitud.numeroSolicitud}</TableCell>
                      <TableCell>{solicitud.numeroExpediente}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            operatorColors[solicitud.operador] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {formatOperator(solicitud.operador)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatTipoExperticia(solicitud.tipoExperticia)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[solicitud.estado || "procesando"] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {formatStatus(solicitud.estado || "procesando")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {solicitud.fechaSolicitud
                          ? new Date(
                              solicitud.fechaSolicitud
                            ).toLocaleDateString()
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
                            onClick={() => onDuplicateSolicitud(solicitud)}
                            title="Duplicar Solicitud"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <FilePlus className="h-4 w-4" />
                          </Button>
                          {permissions.canCreateExperticias && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onCreateExperticia(solicitud)}
                              title="Crear Experticia"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                              <Atom className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Edit button: Only show for "enviada" status OR admin users */}
                          {(solicitud.estado === "enviada" ||
                            permissions.canManageUsers) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(solicitud)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canManageUsers && (
                            <>
                              {/* Delete button: Only show for "enviada" status OR admin users */}
                              {(solicitud.estado === "enviada" ||
                                permissions.canManageUsers) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDelete(solicitud.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </>
                          )}
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
      <Dialog
        open={!!viewingSolicitud}
        onOpenChange={(open) => !open && setViewingSolicitud(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalles de la Solicitud</span>
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

          {viewingSolicitud && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Número de Solicitud
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {viewingSolicitud.numeroSolicitud}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Número de Expediente
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {viewingSolicitud.numeroExpediente}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Fecha de Creación
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {viewingSolicitud.createdAt
                          ? new Date(
                              viewingSolicitud.createdAt
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "No disponible"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Fiscal
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {viewingSolicitud.fiscal || "No asignado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Operador
                      </p>
                      <Badge
                        className={
                          operatorColors[
                            viewingSolicitud.operador as keyof typeof operatorColors
                          ]
                        }
                      >
                        {formatOperator(viewingSolicitud.operador)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-teal-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Estado
                      </p>
                      <Badge
                        className={
                          statusColors[
                            viewingSolicitud.estado as keyof typeof statusColors
                          ]
                        }
                      >
                        {formatStatus(viewingSolicitud.estado || "procesando")}
                      </Badge>
                      {viewingSolicitud.estado === "rechazada" &&
                        viewingSolicitud.motivoRechazo && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-medium text-red-800">
                              Motivo de rechazo:
                            </p>
                            <p className="text-sm text-red-700">
                              {viewingSolicitud.motivoRechazo}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Detalles Técnicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles Técnicos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Tipo de Experticia
                    </p>
                    <p className="text-gray-900">
                      {formatTipoExperticia(viewingSolicitud.tipoExperticia)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Coordinación
                    </p>
                    <p className="text-gray-900">
                      {viewingSolicitud.coordinacionSolicitante}
                    </p>
                  </div>
                </div>

                {/* **NUEVA SECCIÓN: Dirección - agregada antes de Reseña** */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Dirección
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">
                      {viewingSolicitud.direc || "No especificada"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Reseña
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {viewingSolicitud.descripcion || "Sin reseña"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Información Adicional
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Información de Línea
                    </p>
                    <p className="text-gray-900">
                      {viewingSolicitud.informacionLinea || "No disponible"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Fecha de Solicitud
                    </p>
                    <p className="text-gray-900">
                      {viewingSolicitud.fecha_de_solicitud || "No disponible"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Fecha de Actualización
                    </p>
                    <p className="text-gray-900">
                      {viewingSolicitud.updatedAt
                        ? new Date(
                            viewingSolicitud.updatedAt
                          ).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "No disponible"}
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
