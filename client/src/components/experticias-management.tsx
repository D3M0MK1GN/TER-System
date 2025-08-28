import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useExperticias } from "@/hooks/use-experticias";
import { ExperticiasTable } from "@/components/experticia-table";
import { ExperticiasForm } from "@/components/experticia-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Experticia, type InsertExperticia } from "@shared/schema";

export function ExperticiasManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExperticia, setEditingExperticia] = useState<Experticia | null>(null);
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


  const handleCreate = async (data: InsertExperticia) => {
    try {
      // Crear la experticia
      const experticia = await createMutation.mutateAsync({ ...data, usuarioId: user?.id });
      setShowCreateModal(false);
      
      // Intentar generar automáticamente el documento Word de experticia
      try {
        const response = await fetch(`/api/plantillas-word/experticia/${data.tipoExperticia}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            ...data,
            numeroDictamen: data.numeroDictamen,
            experto: data.experto,
            numeroComunicacion: data.numeroComunicacion,
            fechaComunicacion: data.fechaComunicacion,
            motivo: data.motivo,
            operador: data.operador,
            fechaRespuesta: data.fechaRespuesta,
            usoHorario: data.usoHorario,
            abonado: data.abonado,
            datosAbonado: data.datosAbonado,
            conclusion: data.conclusion,
            expediente: data.expediente,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `experticia-${data.numeroDictamen || 'documento'}.docx`;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
          
          toast({
            title: "Experticia creada",
            description: "Experticia creada exitosamente y documento generado automáticamente",
          });
        } else {
          // Experticia creada pero sin documento
          toast({
            title: "Experticia creada",
            description: "Experticia creada exitosamente (sin plantilla de documento disponible)",
          });
        }
      } catch (docError) {
        console.log("Error generando documento:", docError);
        toast({
          title: "Experticia creada",
          description: "Experticia creada exitosamente (sin plantilla de documento disponible)",
        });
      }
    } catch (error) {
      console.error("Error creando experticia:", error);
    }
  };

  const handleUpdate = (data: InsertExperticia) => {
    if (editingExperticia) {
      updateMutation.mutate({
        id: editingExperticia.id,
        data,
      });
      setEditingExperticia(null);
    }
  };

  const handleEdit = (experticia: Experticia) => {
    setEditingExperticia(experticia);
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error obteniendo experticias para exportar');
      }
      
      const data = await response.json();
      const allExperticias = data.experticias || [];
      
      // Import xlsx dynamically
      const XLSX = await import('xlsx');
      
      // Format data for Excel
      const excelData = allExperticias.map((experticia: any) => ({
        'ID': experticia.id,
        'Nº Dictamen': experticia.numeroDictamen,
        'Expediente': experticia.expediente,
        'Experto': experticia.experto,
        'Nº Comunicación': experticia.numeroComunicacion,
        'Fecha Comunicación': experticia.fechaComunicacion || '',
        'Motivo': experticia.motivo || '',
        'Operador': experticia.operador,
        'Fecha Respuesta': experticia.fechaRespuesta || '',
        'Uso Horario': experticia.usoHorario || '',
        'Tipo Experticia': experticia.tipoExperticia,
        'Abonado': experticia.abonado || '',
        'Datos Abonado': experticia.datosAbonado || '',
        'Conclusión': experticia.conclusion || '',
        'Estado': experticia.estado,
        'Fecha Creación': experticia.createdAt ? new Date(experticia.createdAt).toLocaleDateString() : '',
        'Última Actualización': experticia.updatedAt ? new Date(experticia.updatedAt).toLocaleDateString() : '',
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Experticias');
      
      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0];
      const filename = `experticias_${today}.xlsx`;
      
      // Write and download file
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "Excel exportado",
        description: `Se ha descargado el archivo ${filename} con ${allExperticias.length} experticias.`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
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
      <Dialog open={!!editingExperticia} onOpenChange={() => setEditingExperticia(null)}>
        <DialogContent className="max-w-4xl">
          <ExperticiasForm
            experticia={editingExperticia}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExperticia(null)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}