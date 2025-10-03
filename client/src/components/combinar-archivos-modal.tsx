import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, FileSpreadsheet } from "lucide-react";

interface CombinarArchivosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CombinarArchivosModal({ isOpen, onClose }: CombinarArchivosModalProps) {
  const [archivos, setArchivos] = useState<File[]>([]);
  const [combinando, setCombinando] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files).filter(
        file => file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.type === "application/vnd.ms-excel"
      );
      setArchivos(prev => [...prev, ...nuevosArchivos].slice(0, 5));
    }
  };

  const eliminarArchivo = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const combinarArchivos = async () => {
    if (archivos.length < 2) {
      alert("Debes seleccionar al menos 2 archivos para combinar");
      return;
    }

    setCombinando(true);

    const formData = new FormData();
    archivos.forEach((archivo, index) => {
      formData.append(`archivo${index}`, archivo);
    });

    try {
      const response = await fetch("/api/experticias/combinar-excel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al combinar archivos");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "archivos_combinados.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setArchivos([]);
      onClose();
    } catch (error) {
      console.error("Error combinando archivos:", error);
      alert("Error al combinar archivos");
    } finally {
      setCombinando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Combinar Archivos Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-gray-600">
            Selecciona hasta 5 archivos Excel (.xlsx, .xls) para combinarlos en uno solo.
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={archivos.length >= 5}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer ${archivos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {archivos.length >= 5
                  ? "Máximo 5 archivos alcanzado"
                  : "Haz clic para seleccionar archivos"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {archivos.length}/5 archivos seleccionados
              </p>
            </label>
          </div>

          {archivos.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Archivos seleccionados:</h4>
              {archivos.map((archivo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">{archivo.name}</p>
                      <p className="text-xs text-gray-500">
                        {(archivo.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarArchivo(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={combinarArchivos}
              disabled={archivos.length < 2 || combinando}
            >
              {combinando ? "Combinando..." : "Combinar Archivos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
