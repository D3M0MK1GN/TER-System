import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useExperticias } from "@/hooks/use-experticias";
import { ExperticiasTable } from "@/components/experticia-table";
import { ExperticiasForm } from "@/components/experticia-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { downloadFile } from "@/lib/experticia-utils";
import { type Experticia, type InsertExperticia } from "@shared/schema";

const TOKEN = () => localStorage.getItem("token");
const AUTH_HEADER = () => ({ Authorization: `Bearer ${TOKEN()}` });

const saveDatosSeleccionados = async (id: number, datos: any[]) => {
  if (!datos.length) return;
  try {
    await fetch(`/api/experticias/${id}/datos-seleccionados`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER() },
      body: JSON.stringify({ datosSeleccionados: datos }),
    });
  } catch (error) {
    console.log("Error guardando datos seleccionados:", error);
  }
};

const generateDocument = async (
  data: InsertExperticia & { filasSeleccionadas?: any[] },
  experticiaid?: number
) => {
  const url = `/api/plantillas-word/experticia/${data.tipoExperticia}/generate`;
  const filename = `experticia-${data.numeroDictamen || "documento"}.docx`;

  try {
    await downloadFile(url, filename, { authorization: `Bearer ${TOKEN()}` });
  } catch {
    throw new Error("No se pudo generar el documento");
  }
};

export function ExperticiasManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExperticia, setEditingExperticia] = useState<Experticia | null>(
    null
  );
  const [duplicatingExperticia, setDuplicatingExperticia] =
    useState<Experticia | null>(null);
  const pageSize = 10;

  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();

  const {
    experticias,
    total,
    currentPage,
    filters,
    isLoading,
    setCurrentPage,
    setFilters,
    handleDelete,
    createMutation,
    updateMutation,
  } = useExperticias(1, pageSize);

  const handleSaveExperticia = async (
    data: InsertExperticia & { filasSeleccionadas?: any[] },
    isCreating: boolean
  ) => {
    try {
      const experticia = isCreating
        ? await createMutation.mutateAsync({
            ...data,
            datosSeleccionados: data.filasSeleccionadas || null,
            usuarioId: user?.id,
          })
        : (updateMutation.mutate({
            id: editingExperticia!.id,
            data: {
              ...data,
              datosSeleccionados: data.filasSeleccionadas || null,
            },
          }),
          editingExperticia);

      if (experticia?.id && data.filasSeleccionadas?.length) {
        await saveDatosSeleccionados(experticia.id, data.filasSeleccionadas);
      }

      try {
        await generateDocument(data, experticia?.id);
        toast({
          title: "Experticia " + (isCreating ? "creada" : "actualizada"),
          description:
            (isCreating ? "creada" : "actualizada") +
            " exitosamente y documento generado",
        });
      } catch {
        toast({
          title: "Experticia " + (isCreating ? "creada" : "actualizada"),
          description:
            (isCreating ? "creada" : "actualizada") +
            " exitosamente (sin documento)",
        });
      }

      if (isCreating) {
        setShowCreateModal(false);
        setDuplicatingExperticia(null);
      } else {
        setEditingExperticia(null);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreate = (
    data: InsertExperticia & { filasSeleccionadas?: any[] }
  ) => handleSaveExperticia(data, true);

  const handleUpdate = (
    data: InsertExperticia & { filasSeleccionadas?: any[] }
  ) => handleSaveExperticia(data, false);

  const handleEdit = (experticia: Experticia) => {
    setEditingExperticia(experticia);
  };

  const handleDuplicate = (experticia: Experticia) => {
    setDuplicatingExperticia(experticia);
  };

  const handleExportExcel = async () => {
    try {
      // Fetch all experticias without pagination
      const params = new URLSearchParams({
        ...filters,
        page: "1",
        limit: "1000", // Get all records
      });

      const response = await fetch(`/api/experticias?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error obteniendo experticias para exportar");
      }

      const data = await response.json();
      const allExperticias = data.experticias || [];

      // Import xlsx dynamically
      const XLSX = await import("xlsx");

      // Format data for Excel
      const excelData = allExperticias.map((experticia: any) => ({
        ID: experticia.id,
        "Nº Dictamen": experticia.numeroDictamen,
        Expediente: experticia.expediente,
        Experto: experticia.experto,
        "Nº Comunicación": experticia.numeroComunicacion,
        "Fecha Comunicación": experticia.fechaComunicacion || "",
        Motivo: experticia.motivo || "",
        Operador: experticia.operador,
        "Fecha Respuesta": experticia.fechaRespuesta || "",
        "Tipo Experticia": experticia.tipoExperticia,
        Abonado: experticia.abonado || "",
        "Datos Abonado": experticia.datosAbonado || "",
        Conclusión: experticia.conclusion || "",
        Estado: experticia.estado,
        "Fecha Creación": experticia.createdAt
          ? new Date(experticia.createdAt).toLocaleDateString()
          : "",
        "Última Actualización": experticia.updatedAt
          ? new Date(experticia.updatedAt).toLocaleDateString()
          : "",
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Experticias");

      // Generate filename with current date
      const today = new Date().toISOString().split("T")[0];
      const filename = `experticias_${today}.xlsx`;

      // Write and download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Excel exportado",
        description: `Se ha descargado el archivo ${filename} con ${allExperticias.length} experticias.`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description: "Error al exportar a Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <ExperticiasTable
        experticias={experticias}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onFiltersChange={setFilters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={() => {}}
        onCreateNew={() => setShowCreateModal(true)}
        onDuplicate={handleDuplicate}
        onExportExcel={handleExportExcel}
        loading={isLoading}
        permissions={permissions}
      />

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl">
          <ExperticiasForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={!!editingExperticia}
        onOpenChange={() => setEditingExperticia(null)}
      >
        <DialogContent className="max-w-4xl">
          <ExperticiasForm
            experticia={editingExperticia}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExperticia(null)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog
        open={!!duplicatingExperticia}
        onOpenChange={() => setDuplicatingExperticia(null)}
      >
        <DialogContent className="max-w-4xl">
          <ExperticiasForm
            experticia={
              duplicatingExperticia
                ? {
                    ...duplicatingExperticia,
                    id: undefined as any,
                    numeroDictamen: "",
                  }
                : null
            }
            onSubmit={handleCreate}
            onCancel={() => setDuplicatingExperticia(null)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
