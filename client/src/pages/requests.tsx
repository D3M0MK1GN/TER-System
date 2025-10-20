// Pagina para la gestion de Solicitudes
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Layout } from "@/components/layout";
import { RequestTable } from "@/components/request-table";
import { RequestForm } from "@/components/request-form";
import { ExperticiasForm } from "@/components/experticia-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Solicitud, type InsertExperticia } from "@shared/schema";

export default function Requests() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    operador: "",
    estado: "",
    tipoExperticia: "",
    coordinacion: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState<Solicitud | null>(
    null
  );
  const [showExperticiasModal, setShowExperticiasModal] = useState(false);
  const [experticiasPreloadData, setExperticiasPreloadData] =
    useState<Partial<InsertExperticia> | null>(null);
  const [duplicateSolicitudData, setDuplicateSolicitudData] =
    useState<any>(null);
  const pageSize = 10;

  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Función para generar el número de comunicación en el formato requerido
  const generateNumeroComunicacion = (numeroSolicitud: string): string => {
    const currentYear = new Date().getFullYear();
    const parts = numeroSolicitud.split("-");

    if (parts.length >= 2) {
      // Formato: 9700-PARTE1-CIDCPER-AÑO-PARTE2
      return `9700-${parts[0]}-CIDCPER-${currentYear}-${parts[1]}`;
    }

    // Fallback si el formato no es el esperado
    return `9700-${numeroSolicitud}-CIDCPER-${currentYear}`;
  };

  // Función para crear experticia desde una solicitud
  const handleCreateExperticia = (solicitud: Solicitud) => {
    const fechaComunicacion = solicitud.fechaSolicitud
      ? new Date(solicitud.fechaSolicitud).toLocaleDateString("es-ES")
      : "";

    const preloadData: Partial<InsertExperticia> = {
      expediente: solicitud.numeroExpediente,
      fechaComunicacion: fechaComunicacion,
      numeroComunicacion: generateNumeroComunicacion(solicitud.numeroSolicitud),
      operador: solicitud.operador,
      tipoExperticia: solicitud.tipoExperticia,
    };

    setExperticiasPreloadData(preloadData);
    setShowExperticiasModal(true);
  };

  // Función para duplicar solicitud
  const handleDuplicateSolicitud = (solicitud: Solicitud) => {
    const duplicateData = {
      numeroSolicitud: solicitud.numeroSolicitud,
      numeroExpediente: solicitud.numeroExpediente,
      fiscal: solicitud.fiscal || "",
      tipoExperticia: solicitud.tipoExperticia,
      coordinacionSolicitante: solicitud.coordinacionSolicitante,
      operador: solicitud.operador,
      informacionLinea: solicitud.informacionLinea,
      fecha_de_solicitud: solicitud.fecha_de_solicitud,
      direc: solicitud.direc,
      delito: solicitud.delito,
      descripcion: solicitud.descripcion,
      oficio: solicitud.oficio,
      fechaSolicitud: solicitud.fechaSolicitud
        ? new Date(solicitud.fechaSolicitud).toISOString().split("T")[0]
        : "",
    };

    setDuplicateSolicitudData(duplicateData);
    setShowCreateModal(true);
  };

  const handleTemplateDownload = async (
    tipoExperticia: string,
    requestData?: any
  ) => {
    try {
      const response = await fetch(
        `/api/plantillas-word/by-expertise/${tipoExperticia}/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData || {}),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          response.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") || "plantilla.docx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Plantilla Word descargada",
          description:
            "La plantilla Word se ha descargado con los datos de la solicitud.",
        });
      } else if (response.status === 404) {
        // No template available for this expertise type, silently continue
      }
    } catch (error) {
      // Silent error for download failures
    }
  };

  const handleExcelDownload = async (requestData?: any) => {
    try {
      const response = await fetch(`/api/solicitudes/generate-excel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData || {}),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          response.headers
            .get("content-disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") || "planilla_datos.xlsx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Archivo Excel descargado",
          description:
            "El archivo Excel se ha descargado con los datos de la solicitud.",
        });
      } else if (response.status === 404) {
        toast({
          title: "Error",
          description: "Plantilla Excel no encontrada",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error descargando archivo Excel",
        variant: "destructive",
      });
    }
  };

  const { data: solicitudesData, isLoading } = useQuery({
    queryKey: ["/api/solicitudes", currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...filters,
      });

      const response = await fetch(`/api/solicitudes?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error obteniendo solicitudes");
      }

      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiRequest("/api/solicitudes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateModal(false);
      toast({
        title: "Solicitud creada",
        description: "La solicitud ha sido creada exitosamente",
      });

      // Download templates after successful creation with request data
      if (variables.tipoExperticia) {
        handleTemplateDownload(variables.tipoExperticia, variables);
      }

      // Always download Excel with request data
      handleExcelDownload(variables);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error creando la solicitud",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Record<string, any>;
    }) => {
      return await apiRequest(`/api/solicitudes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setEditingSolicitud(null);
      toast({
        title: "Solicitud actualizada",
        description: "La solicitud ha sido actualizada exitosamente",
      });
      // Note: No template download for updates, only for new creations
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error actualizando la solicitud",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/solicitudes/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Solicitud eliminada",
        description: "La solicitud ha sido eliminada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error eliminando la solicitud",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: Record<string, any>) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: Record<string, any>) => {
    if (editingSolicitud) {
      updateMutation.mutate({ id: editingSolicitud.id, data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta solicitud?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (solicitud: Solicitud) => {
    // TODO: Implement view modal
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleExportExcel = async () => {
    try {
      // Fetch all solicitudes without pagination
      const params = new URLSearchParams({
        ...filters,
        page: "1",
        limit: "1000", // Get all records
      });

      const response = await fetch(`/api/solicitudes?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error obteniendo solicitudes para exportar");
      }

      const data = await response.json();
      const allSolicitudes = data.solicitudes || [];

      // Import xlsx dynamically
      const XLSX = await import("xlsx");

      // Format data for Excel
      const excelData = allSolicitudes.map((solicitud: any) => ({
        ID: solicitud.id,
        "Nº Solicitud": solicitud.numeroSolicitud,
        "Nº Expediente": solicitud.numeroExpediente,
        Operador: solicitud.operador,
        "Tipo Experticia": solicitud.tipoExperticia,
        Estado: solicitud.estado,
        Coordinación: solicitud.coordinacionSolicitante,
        Fiscal: solicitud.fiscal || "",
        Reseña: solicitud.descripcion || "",
        "Fecha Solicitud": solicitud.fechaSolicitud
          ? new Date(solicitud.fechaSolicitud).toLocaleDateString()
          : "",
        "Fecha Creación": solicitud.createdAt
          ? new Date(solicitud.createdAt).toLocaleDateString()
          : "",
        "Última Actualización": solicitud.updatedAt
          ? new Date(solicitud.updatedAt).toLocaleDateString()
          : "",
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Solicitudes");

      // Generate filename with current date
      const today = new Date().toISOString().split("T")[0];
      const filename = `solicitudes_${today}.xlsx`;

      // Write and download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Excel exportado",
        description: `Se ha descargado el archivo ${filename} con ${allSolicitudes.length} solicitudes.`,
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

  // Mutación para crear experticias
  const createExperticiaMutation = useMutation({
    mutationFn: async (data: InsertExperticia) => {
      return await apiRequest("/api/experticias", {
        method: "POST",
        body: JSON.stringify({ ...data, usuarioId: user?.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experticias"] });
      setShowExperticiasModal(false);
      setExperticiasPreloadData(null);
      toast({
        title: "Experticia creada",
        description:
          "La experticia ha sido creada exitosamente desde la solicitud",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error creando la experticia",
        variant: "destructive",
      });
    },
  });

  const handleCreateExperticiasSubmit = (data: InsertExperticia) => {
    createExperticiaMutation.mutate(data);
  };

  const solicitudes = solicitudesData?.solicitudes || [];
  const total = solicitudesData?.total || 0;

  return (
    <Layout
      title="Gestión de Solicitudes"
      subtitle="Crear, editar y administrar solicitudes"
    >
      <div className="p-6">
        <RequestTable
          solicitudes={solicitudes}
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onFiltersChange={handleFiltersChange}
          onEdit={setEditingSolicitud}
          onDelete={handleDelete}
          onView={handleView}
          onCreateNew={() => setShowCreateModal(true)}
          onCreateExperticia={handleCreateExperticia}
          onDuplicateSolicitud={handleDuplicateSolicitud}
          onExportExcel={handleExportExcel}
          loading={isLoading}
          permissions={permissions}
        />
      </div>

      {/* Create Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={() => {
          setShowCreateModal(false);
          setDuplicateSolicitudData(null);
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
          }}
        >
          <RequestForm
            onSubmit={handleCreateSubmit}
            onCancel={() => {
              setShowCreateModal(false);
              setDuplicateSolicitudData(null);
            }}
            isLoading={createMutation.isPending}
            initialData={duplicateSolicitudData || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={!!editingSolicitud}
        onOpenChange={() => setEditingSolicitud(null)}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
          }}
        >
          {editingSolicitud && (
            <RequestForm
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingSolicitud(null)}
              initialData={{
                ...editingSolicitud,
                fiscal: editingSolicitud.fiscal || "",
              }}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Experticia Modal */}
      <Dialog
        open={showExperticiasModal}
        onOpenChange={setShowExperticiasModal}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
          }}
        >
          <ExperticiasForm
            onSubmit={handleCreateExperticiasSubmit}
            onCancel={() => {
              setShowExperticiasModal(false);
              setExperticiasPreloadData(null);
            }}
            isLoading={createExperticiaMutation.isPending}
            preloadData={experticiasPreloadData}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
