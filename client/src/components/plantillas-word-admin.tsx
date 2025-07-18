import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Upload, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlantillaWord {
  id: number;
  nombre: string;
  tipoExperticia: string;
  nombreArchivo: string;
  tamaño: number;
  createdAt: string;
}

const tiposExperticia = [
  { value: "analisis_radioespectro", label: "Análisis Radioespectro" },
  { value: "identificacion_bts", label: "Identificación BTS" },
  { value: "analisis_trafico", label: "Análisis Tráfico" },
  { value: "localizacion_antenas", label: "Localización Antenas" },
  { value: "analisis_cobertura", label: "Análisis Cobertura" },
  { value: "otros", label: "Otros" },
];

export function PlantillasWordAdmin() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    tipoExperticia: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plantillas = [], isLoading } = useQuery({
    queryKey: ["/api/plantillas-word"],
    queryFn: () => apiRequest("/api/plantillas-word"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/plantillas-word/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-word"] });
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se eliminó exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la plantilla",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !formData.nombre || !formData.tipoExperticia) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos y selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("archivo", selectedFile);
      uploadFormData.append("nombre", formData.nombre);
      uploadFormData.append("tipoExperticia", formData.tipoExperticia);

      const response = await fetch("/api/plantillas-word", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al subir la plantilla");
      }

      await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/plantillas-word"] });
      
      // Reset form
      setSelectedFile(null);
      setFormData({ nombre: "", tipoExperticia: "" });
      (document.getElementById("fileInput") as HTMLInputElement).value = "";

      toast({
        title: "Plantilla subida",
        description: "La plantilla se subió exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al subir la plantilla",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await fetch(`/api/plantillas-word/${id}/download`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar la plantilla");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || "plantilla.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al descargar la plantilla",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTipoExperticiaBadge = (tipo: string) => {
    const tipoInfo = tiposExperticia.find(t => t.value === tipo);
    return tipoInfo ? tipoInfo.label : tipo;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administración de Plantillas Word</h1>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nueva Plantilla
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de la Plantilla</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre descriptivo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipoExperticia">Tipo de Experticia</Label>
                <Select
                  value={formData.tipoExperticia}
                  onValueChange={(value) => setFormData({ ...formData, tipoExperticia: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de experticia" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposExperticia.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="fileInput">Archivo Word (.doc, .docx)</Label>
              <Input
                id="fileInput"
                type="file"
                accept=".doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Subiendo..." : "Subir Plantilla"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plantillas Existentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando plantillas...</div>
          ) : plantillas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay plantillas disponibles
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de Experticia</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantillas.map((plantilla: PlantillaWord) => (
                  <TableRow key={plantilla.id}>
                    <TableCell className="font-medium">{plantilla.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getTipoExperticiaBadge(plantilla.tipoExperticia)}
                      </Badge>
                    </TableCell>
                    <TableCell>{plantilla.nombreArchivo}</TableCell>
                    <TableCell>{formatFileSize(plantilla.tamaño)}</TableCell>
                    <TableCell>
                      {new Date(plantilla.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(plantilla.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(plantilla.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}