import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useSidebarContext } from "@/hooks/use-sidebar-context";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Activity } from "lucide-react";

export default function Trazabilidad() {
  const { isOpen } = useSidebarContext();
  const [tipoBusqueda, setTipoBusqueda] = useState<string>("cedula");
  const [valorBusqueda, setValorBusqueda] = useState<string>("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    
    // Simulación de búsqueda - aquí se conectará al backend
    setTimeout(() => {
      setResultados([]);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        isOpen ? "ml-64" : "ml-16"
      )}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              Análisis de Trazabilidad
            </h1>
            <p className="text-gray-600 mt-2">
              Busca y analiza la trazabilidad de personas, números telefónicos y expedientes
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
                  <Select
                    value={tipoBusqueda}
                    onValueChange={setTipoBusqueda}
                  >
                    <SelectTrigger data-testid="select-tipo-busqueda">
                      <SelectValue placeholder="Seleccionar tipo de búsqueda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cedula">Cédula</SelectItem>
                      <SelectItem value="nombre">Nombre</SelectItem>
                      <SelectItem value="seudonimo">Seudonimo</SelectItem>
                      <SelectItem value="numero">Número Telefónico</SelectItem>
                      <SelectItem value="expediente">Expediente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-[2]">
                  <Input
                    data-testid="input-busqueda"
                    type="text"
                    placeholder={`Ingrese ${tipoBusqueda === "cedula" ? "la cédula" : tipoBusqueda === "nombre" ? "el nombre" : tipoBusqueda === "seudonimo" ? "el seudonimo" : tipoBusqueda === "numero" ? "el número" : "el expediente"}`}
                    value={valorBusqueda}
                    onChange={(e) => setValorBusqueda(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
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

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados de la Búsqueda</CardTitle>
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Nombre Completo</TableHead>
                        <TableHead>Expediente</TableHead>
                        <TableHead>Nro. Asociado</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultados.map((resultado, index) => (
                        <TableRow key={index} data-testid={`row-resultado-${index}`}>
                          <TableCell data-testid={`text-tipo-${index}`}>
                            {resultado.tipo}
                          </TableCell>
                          <TableCell data-testid={`text-cedula-${index}`}>
                            {resultado.cedula}
                          </TableCell>
                          <TableCell data-testid={`text-nombre-${index}`}>
                            {resultado.nombre}
                          </TableCell>
                          <TableCell data-testid={`text-expediente-${index}`}>
                            {resultado.expediente}
                          </TableCell>
                          <TableCell data-testid={`text-numero-${index}`}>
                            {resultado.numeroAsociado}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              data-testid={`button-analizar-${index}`}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                console.log('Analizar traza:', resultado);
                              }}
                            >
                              <Activity className="h-4 w-4 mr-2" />
                              Analizar Traza
                            </Button>
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
    </div>
  );
}
