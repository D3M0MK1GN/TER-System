import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useSidebarContext } from "@/hooks/use-sidebar-context";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Activity,
  User,
  Phone,
  GitMerge,
  Info,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Repeat,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GrafoTrazabilidad } from "@/components/GrafoTrazabilidad";

interface ResultadoBusqueda {
  id: number;
  expediente: string;
  cedula: string;
  nombreCompleto: string;
  numeroAsociado: string;
  delito: string;
  fechaInicio: string;
}

export default function Trazabilidad() {
  const { isOpen } = useSidebarContext();
  const { toast } = useToast();
  const [tipoBusqueda, setTipoBusqueda] = useState<string>("cedula");
  const [valorBusqueda, setValorBusqueda] = useState<string>("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estados para modales
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showRegistrosModal, setShowRegistrosModal] = useState(false);
  const [showCoincidenciasModal, setShowCoincidenciasModal] = useState(false);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);

  // Datos de los modales
  const [personaData, setPersonaData] = useState<any>(null);
  const [registrosData, setRegistrosData] = useState<any[]>([]);
  const [coincidenciasData, setCoincidenciasData] = useState<any>(null);
  const [analisisData, setAnalisisData] = useState<any>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Estados para tabla de registros
  const [filtroGlobal, setFiltroGlobal] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoEvento, setTipoEvento] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(50);

  // Estado para pantalla completa del modal de análisis
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/trazabilidad/buscar?tipo=${tipoBusqueda}&valor=${encodeURIComponent(
          valorBusqueda
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResultados(data.resultados || []);
        if (data.total === 0) {
          toast({
            title: "Sin resultados",
            description:
              "No se encontraron registros con los criterios especificados",
            variant: "default",
          });
        }
      } else {
        setResultados([]);
        toast({
          title: "Error",
          description: "No se pudo realizar la búsqueda",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al buscar:", error);
      setResultados([]);
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleInfoPersona = async (personaId: number) => {
    // Limpiar datos anteriores antes de abrir el modal
    setPersonaData(null);
    setLoadingModal(true);
    setShowPersonaModal(true);

    try {
      const response = await fetch(`/api/personas-casos/${personaId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonaData(data);
      } else {
        // En caso de error, cerrar el modal
        setShowPersonaModal(false);
        toast({
          title: "Error",
          description: "No se pudo obtener la información de la persona",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al obtener información de persona:", error);
      // En caso de error, cerrar el modal
      setShowPersonaModal(false);
      toast({
        title: "Error",
        description: "No se pudo obtener la información de la persona",
        variant: "destructive",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleVerRegistros = async (numero: string) => {
    // Limpiar datos anteriores y filtros antes de abrir el modal
    setRegistrosData([]);
    setFiltroGlobal("");
    setFechaInicio("");
    setFechaFin("");
    setTipoEvento("todos");
    setPaginaActual(1);
    setLoadingModal(true);
    setShowRegistrosModal(true);

    try {
      const response = await fetch(
        `/api/registros-comunicacion/abonado/${encodeURIComponent(numero)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRegistrosData(data);
      } else {
        setShowRegistrosModal(false);
        toast({
          title: "Error",
          description: "No se pudieron obtener los registros de comunicación",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al obtener registros:", error);
      setShowRegistrosModal(false);
      toast({
        title: "Error",
        description: "No se pudieron obtener los registros de comunicación",
        variant: "destructive",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  // Función para filtrar registros
  const getRegistrosFiltrados = () => {
    let filtrados = [...registrosData];

    // Filtro global
    if (filtroGlobal.trim()) {
      const busqueda = filtroGlobal.toLowerCase();
      filtrados = filtrados.filter((reg) =>
        Object.values(reg).some((val) =>
          String(val).toLowerCase().includes(busqueda)
        )
      );
    }

    // Filtro por fecha
    if (fechaInicio) {
      filtrados = filtrados.filter((reg) => reg.fecha >= fechaInicio);
    }
    if (fechaFin) {
      filtrados = filtrados.filter((reg) => reg.fecha <= fechaFin);
    }

    // Filtro por tipo de evento
    if (tipoEvento !== "todos") {
      filtrados = filtrados.filter((reg) =>
        reg.tipoYTransaccion?.toLowerCase().includes(tipoEvento.toLowerCase())
      );
    }

    return filtrados;
  };

  // Función para exportar a CSV
  const exportarRegistrosCSV = () => {
    const registrosFiltrados = getRegistrosFiltrados();
    if (registrosFiltrados.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay registros para exportar",
        variant: "default",
      });
      return;
    }

    const headers = [
      "Abonado A",
      "Abonado B",
      "Fecha",
      "Hora",
      "Tipo y Transacción",
      "Segundos",
      "Dirección Inicial A",
      "Latitud",
      "Longitud",
      "IMEI1 A",
      "IMEI2 A",
      "IMEI1 B",
      "IMEI2 B",
      "Archivo",
      "Peso",
    ];

    const rows = registrosFiltrados.map((reg) => [
      reg.abonadoA || "",
      reg.abonadoB || "",
      reg.fecha || "",
      reg.hora || "",
      reg.tipoYTransaccion || "",
      reg.segundos || "",
      reg.direccionInicialA || "",
      reg.latitudInicialA || "",
      reg.longitudInicialA || "",
      reg.imei1A || "",
      reg.imei2A || "",
      reg.imei1B || "",
      reg.imei2B || "",
      reg.archivo || "",
      reg.peso || "",
    ]);

    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `registros_comunicacion_${new Date().getTime()}.csv`;
    link.click();

    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${registrosFiltrados.length} registros`,
    });
  };

  // Función para iniciar análisis de un contacto
  const handleAnalizarContacto = (numeroContacto: string) => {
    if (
      confirm(
        `¿Desea iniciar un nuevo análisis para el número ${numeroContacto}?`
      )
    ) {
      setShowRegistrosModal(false);
      handleAnalizarTraza(numeroContacto);
    }
  };

  const handleCoincidencias = async (numero: string) => {
    // Limpiar datos anteriores antes de abrir el modal
    setCoincidenciasData(null);
    setLoadingModal(true);
    setShowCoincidenciasModal(true);

    try {
      const response = await fetch(
        `/api/trazabilidad/coincidencias/${encodeURIComponent(numero)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCoincidenciasData(data);
      } else {
        // En caso de error, cerrar el modal
        setShowCoincidenciasModal(false);
        toast({
          title: "Error",
          description: "No se pudieron obtener las coincidencias",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al obtener coincidencias:", error);
      // En caso de error, cerrar el modal
      setShowCoincidenciasModal(false);
      toast({
        title: "Error",
        description: "No se pudieron obtener las coincidencias",
        variant: "destructive",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleAnalizarTraza = async (numero: string) => {
    // Limpiar datos anteriores antes de abrir el modal
    setAnalisisData(null);
    setLoadingModal(true);
    setShowAnalisisModal(true);

    try {
      const response = await fetch(
        `/api/trazabilidad/${encodeURIComponent(numero)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalisisData(data);
      } else {
        // En caso de error, cerrar el modal
        setShowAnalisisModal(false);
        toast({
          title: "Error",
          description: "No se pudo realizar el análisis de trazabilidad",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al analizar traza:", error);
      // En caso de error, cerrar el modal
      setShowAnalisisModal(false);
      toast({
        title: "Error",
        description: "No se pudo realizar el análisis de trazabilidad",
        variant: "destructive",
      });
    } finally {
      setLoadingModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          isOpen ? "ml-64" : "ml-16"
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              Análisis de Trazabilidad
            </h1>
            <p className="text-gray-600 mt-2">
              Busca y analiza la trazabilidad de personas, números telefónicos y
              expedientes
            </p>
          </div>

          {/* Búsqueda */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Buscar Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={tipoBusqueda} onValueChange={setTipoBusqueda}>
                    <SelectTrigger data-testid="select-tipo-busqueda">
                      <SelectValue placeholder="Seleccionar tipo de búsqueda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cedula">Cédula</SelectItem>
                      <SelectItem value="nombre">Nombre</SelectItem>
                      <SelectItem value="seudonimo">Seudónimo</SelectItem>
                      <SelectItem value="numero">Número Telefónico</SelectItem>
                      <SelectItem value="expediente">Expediente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[2]">
                  <Input
                    data-testid="input-busqueda"
                    type="text"
                    placeholder={`Ingrese ${
                      tipoBusqueda === "cedula"
                        ? "la cédula"
                        : tipoBusqueda === "nombre"
                        ? "el nombre"
                        : tipoBusqueda === "seudonimo"
                        ? "el seudónimo"
                        : tipoBusqueda === "numero"
                        ? "el número"
                        : "el expediente"
                    }`}
                    value={valorBusqueda}
                    onChange={(e) => setValorBusqueda(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && valorBusqueda.trim()) {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <div>
                  <Button
                    data-testid="button-buscar"
                    onClick={handleSearch}
                    disabled={!valorBusqueda.trim() || isSearching}
                    className="w-full md:w-auto"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados - Tabla Maestra */}
          <Card>
            <CardHeader>
              <CardTitle>
                Resultados de la Búsqueda ({resultados.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No hay resultados</p>
                  <p className="text-sm mt-2">
                    {valorBusqueda.trim()
                      ? "No se encontraron registros con los criterios especificados"
                      : "Utiliza el campo de búsqueda para encontrar información"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expediente</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Nombre Completo</TableHead>
                        <TableHead>Número Asociado</TableHead>
                        <TableHead>Delito</TableHead>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead className="text-center w-[300px]">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((resultado, index) => (
                        <TableRow
                          key={index}
                          data-testid={`row-resultado-${index}`}
                        >
                          <TableCell
                            data-testid={`text-expediente-${index}`}
                            className="font-medium"
                          >
                            {resultado.expediente}
                          </TableCell>
                          <TableCell data-testid={`text-cedula-${index}`}>
                            {resultado.cedula}
                          </TableCell>
                          <TableCell data-testid={`text-nombre-${index}`}>
                            {resultado.nombreCompleto}
                          </TableCell>
                          <TableCell data-testid={`text-numero-${index}`}>
                            {resultado.numeroAsociado}
                          </TableCell>
                          <TableCell data-testid={`text-delito-${index}`}>
                            {resultado.delito}
                          </TableCell>
                          <TableCell data-testid={`text-fecha-${index}`}>
                            {resultado.fechaInicio
                              ? new Date(
                                  resultado.fechaInicio
                                ).toLocaleDateString("es-ES")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 justify-center">
                              <Button
                                data-testid={`button-analizar-${index}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleAnalizarTraza(resultado.numeroAsociado)
                                }
                                title="Analizar Traza"
                              >
                                <Activity className="h-3 w-3" />
                              </Button>
                              <Button
                                data-testid={`button-info-${index}`}
                                size="sm"
                                variant="outline"
                                onClick={() => handleInfoPersona(resultado.id)}
                                title="Info Persona/Caso"
                              >
                                <User className="h-3 w-3" />
                              </Button>
                              <Button
                                data-testid={`button-registros-${index}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleVerRegistros(resultado.numeroAsociado)
                                }
                                title="Ver Registros"
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button
                                data-testid={`button-coincidencias-${index}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleCoincidencias(resultado.numeroAsociado)
                                }
                                title="Coincidencias"
                              >
                                <GitMerge className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Info Persona/Caso */}
      <Dialog open={showPersonaModal} onOpenChange={setShowPersonaModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información de Persona/Caso
            </DialogTitle>
          </DialogHeader>
          {loadingModal ? (
            <div className="py-8 text-center text-gray-500">Cargando...</div>
          ) : personaData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Expediente:
                  </label>
                  <p className="text-gray-900">{personaData.expediente}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Teléfono Principal:
                  </label>
                  <p className="text-gray-900 font-mono">
                    {personaData.telefono || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Cédula:
                  </label>
                  <p className="text-gray-900">{personaData.cedula}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Nombre:
                  </label>
                  <p className="text-gray-900">
                    {personaData.nombre} {personaData.apellido}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Seudónimo:
                  </label>
                  <p className="text-gray-900">
                    {personaData.pseudonimo || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Delito:
                  </label>
                  <p className="text-gray-900">{personaData.delito}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Fecha de Inicio:
                  </label>
                  <p className="text-gray-900">
                    {personaData.fechaDeInicio
                      ? new Date(personaData.fechaDeInicio).toLocaleDateString(
                          "es-ES"
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>

              {personaData.telefonosAsociados &&
                personaData.telefonosAsociados.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Números Telefónicos Asociados:
                    </label>
                    <div className="mt-2 space-y-1">
                      {personaData.telefonosAsociados.map(
                        (tel: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded">
                            <p className="font-mono text-sm">{tel.numero}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Dirección:
                </label>
                <p className="text-gray-900">
                  {personaData.direccion || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Descripción:
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {personaData.descripcion || "Sin descripción"}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se pudo cargar la información
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Ver Registros de Comunicación */}
      <Dialog open={showRegistrosModal} onOpenChange={setShowRegistrosModal}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Registros de Comunicación Detallados
            </DialogTitle>
          </DialogHeader>
          {loadingModal ? (
            <div className="py-8 text-center text-gray-500">Cargando...</div>
          ) : (
            <div className="space-y-4">
              {/* Controles de filtrado y exportación */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                {/* Filtro Global */}
                <div className="lg:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    <Filter className="h-3 w-3 inline mr-1" />
                    Filtro Global
                  </label>
                  <Input
                    data-testid="input-filtro-global"
                    type="text"
                    placeholder="Buscar en todos los campos..."
                    value={filtroGlobal}
                    onChange={(e) => {
                      setFiltroGlobal(e.target.value);
                      setPaginaActual(1);
                    }}
                    className="text-sm"
                  />
                </div>

                {/* Filtro Fecha Inicio */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Fecha Inicio
                  </label>
                  <Input
                    data-testid="input-fecha-inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => {
                      setFechaInicio(e.target.value);
                      setPaginaActual(1);
                    }}
                    className="text-sm"
                  />
                </div>

                {/* Filtro Fecha Fin */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Fecha Fin
                  </label>
                  <Input
                    data-testid="input-fecha-fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => {
                      setFechaFin(e.target.value);
                      setPaginaActual(1);
                    }}
                    className="text-sm"
                  />
                </div>

                {/* Filtro Tipo de Evento */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Tipo de Evento
                  </label>
                  <Select
                    value={tipoEvento}
                    onValueChange={(value) => {
                      setTipoEvento(value);
                      setPaginaActual(1);
                    }}
                  >
                    <SelectTrigger
                      data-testid="select-tipo-evento"
                      className="text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="llamada">Llamadas</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="saliente">Salientes</SelectItem>
                      <SelectItem value="entrante">Entrantes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Registros por página */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Registros por página
                  </label>
                  <Select
                    value={String(registrosPorPagina)}
                    onValueChange={(value) => {
                      setRegistrosPorPagina(Number(value));
                      setPaginaActual(1);
                    }}
                  >
                    <SelectTrigger
                      data-testid="select-registros-pagina"
                      className="text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón Exportar */}
                <div className="flex items-end">
                  <Button
                    data-testid="button-exportar-csv"
                    onClick={exportarRegistrosCSV}
                    variant="outline"
                    className="w-full text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {/* Tabla de registros */}
              {(() => {
                const registrosFiltrados = getRegistrosFiltrados();
                const totalPaginas = Math.ceil(
                  registrosFiltrados.length / registrosPorPagina
                );
                const inicio = (paginaActual - 1) * registrosPorPagina;
                const fin = inicio + registrosPorPagina;
                const registrosPagina = registrosFiltrados.slice(inicio, fin);

                return registrosFiltrados.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Abonado A</TableHead>
                            <TableHead className="text-xs">Abonado B</TableHead>
                            <TableHead className="text-xs">Fecha</TableHead>
                            <TableHead className="text-xs">Hora</TableHead>
                            <TableHead className="text-xs">Tipo</TableHead>
                            <TableHead className="text-xs">Seg.</TableHead>
                            <TableHead className="text-xs">Dirección</TableHead>
                            <TableHead className="text-xs">Lat/Long</TableHead>
                            <TableHead className="text-xs">IMEI A</TableHead>
                            <TableHead className="text-xs">IMEI B</TableHead>
                            <TableHead className="text-xs text-center">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrosPagina.map((registro, idx) => (
                            <TableRow
                              key={idx}
                              data-testid={`row-registro-${idx}`}
                            >
                              <TableCell
                                className="font-mono text-xs"
                                data-testid={`text-abonado-a-${idx}`}
                              >
                                {registro.abonadoA || "N/A"}
                              </TableCell>
                              <TableCell
                                className="font-mono text-xs"
                                data-testid={`text-abonado-b-${idx}`}
                              >
                                {registro.abonadoB || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {registro.fecha || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {registro.hora || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {registro.tipoYTransaccion || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {registro.segundos || "0"}
                              </TableCell>
                              <TableCell className="text-xs max-w-[150px] truncate">
                                {registro.direccionInicialA || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {registro.latitudInicialA &&
                                registro.longitudInicialA
                                  ? `${registro.latitudInicialA}, ${registro.longitudInicialA}`
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {registro.imei1A || "N/A"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {registro.imei1B || "N/A"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  data-testid={`button-trazar-contacto-${idx}`}
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleAnalizarContacto(registro.abonadoB)
                                  }
                                  disabled={!registro.abonadoB}
                                  title="Ver Traza de Contacto"
                                >
                                  <Repeat className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {inicio + 1} a{" "}
                        {Math.min(fin, registrosFiltrados.length)} de{" "}
                        {registrosFiltrados.length} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          data-testid="button-pagina-anterior"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setPaginaActual((prev) => Math.max(1, prev - 1))
                          }
                          disabled={paginaActual === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Página {paginaActual} de {totalPaginas || 1}
                        </span>
                        <Button
                          data-testid="button-pagina-siguiente"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setPaginaActual((prev) =>
                              Math.min(totalPaginas, prev + 1)
                            )
                          }
                          disabled={paginaActual >= totalPaginas}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No hay registros que coincidan con los filtros
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Coincidencias */}
      <Dialog
        open={showCoincidenciasModal}
        onOpenChange={setShowCoincidenciasModal}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Coincidencias y Casos Vinculados
            </DialogTitle>
          </DialogHeader>
          {loadingModal ? (
            <div className="py-8 text-center text-gray-500">Cargando...</div>
          ) : coincidenciasData ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Número Analizado:</strong>{" "}
                  {coincidenciasData.numeroAnalizado}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Total de Contactos:</strong>{" "}
                  {coincidenciasData.totalContactos}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Coincidencias Encontradas:</strong>{" "}
                  {coincidenciasData.coincidenciasEncontradas}
                </p>
              </div>

              {coincidenciasData.coincidencias &&
              coincidenciasData.coincidencias.length > 0 ? (
                <div className="space-y-3">
                  {coincidenciasData.coincidencias.map(
                    (coincidencia: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-sm text-gray-600 mb-2">
                                📞 {coincidencia.numeroContactado}
                              </p>
                              <p className="font-semibold text-gray-900">
                                {coincidencia.persona.nombreCompleto}
                              </p>
                              <p className="text-sm text-gray-600">
                                Cédula: {coincidencia.persona.cedula}
                              </p>
                              <p className="text-sm text-gray-600">
                                Expediente: {coincidencia.persona.expediente}
                              </p>
                              <p className="text-sm text-gray-600">
                                Delito: {coincidencia.persona.delito}
                              </p>
                            </div>
                            <Info className="h-5 w-5 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No se encontraron coincidencias con casos registrados
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se pudo cargar las coincidencias
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Análisis de Traza */}
      <Dialog open={showAnalisisModal} onOpenChange={setShowAnalisisModal}>
        <DialogContent
          className={
            isModalFullscreen
              ? "max-w-full max-h-full w-screen h-screen overflow-y-auto m-0 p-6"
              : "max-w-6xl max-h-[90vh] overflow-y-auto"
          }
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Análisis Detallado de Trazabilidad - Grafo de Relaciones
            </DialogTitle>
          </DialogHeader>
          {loadingModal ? (
            <div className="py-8 text-center text-gray-500">Cargando...</div>
          ) : analisisData && analisisData.nodos && analisisData.aristas ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-900">
                  <strong>Número Analizado:</strong>{" "}
                  {analisisData.numeroAnalizado}
                </p>
                <p className="text-sm text-green-900">
                  <strong>Total de Comunicaciones:</strong>{" "}
                  {analisisData.totalComunicaciones}
                </p>
                <p className="text-sm text-green-900">
                  <strong>Nodos en la Red:</strong>{" "}
                  {analisisData.nodos?.length || 0}
                </p>
              </div>

              {/* Componente de Grafo Interactivo */}
              <GrafoTrazabilidad
                nodos={analisisData.nodos}
                aristas={analisisData.aristas}
                isFullscreen={isModalFullscreen}
                onToggleFullscreen={() =>
                  setIsModalFullscreen(!isModalFullscreen)
                }
                onNodeClick={async (nodo) => {
                  // Expandir nodo externo - llamar al mismo endpoint con ese número
                  if (nodo.type === "Externo") {
                    try {
                      setLoadingModal(true);
                      const token = localStorage.getItem("token");
                      const response = await fetch(
                        `/api/trazabilidad/${nodo.id}`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                      if (!response.ok)
                        throw new Error("Error al expandir nodo");
                      const newData = await response.json();

                      // Combinar los nodos y aristas nuevas con las existentes
                      const existingNodeIds = new Set(
                        analisisData.nodos.map((n: any) => n.id)
                      );
                      const newNodos = newData.nodos.filter(
                        (n: any) => !existingNodeIds.has(n.id)
                      );

                      setAnalisisData({
                        ...analisisData,
                        nodos: [...analisisData.nodos, ...newNodos],
                        aristas: [...analisisData.aristas, ...newData.aristas],
                      });

                      toast({
                        title: "Nodo expandido",
                        description: `Se agregaron ${newNodos.length} nuevos nodos`,
                      });
                    } catch (error) {
                      console.error("Error al expandir nodo:", error);
                      toast({
                        title: "Error",
                        description: "No se pudo expandir el nodo",
                        variant: "destructive",
                      });
                    } finally {
                      setLoadingModal(false);
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se pudo cargar el análisis
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
