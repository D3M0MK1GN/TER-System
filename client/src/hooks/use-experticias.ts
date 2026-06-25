import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Experticia, type InsertExperticia } from "@shared/schema";

interface ExperticiasFilters {
  operador?: string;
  estado?: string;
  tipoExperticia?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useExperticias(initialPage = 1, pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState<ExperticiasFilters>({
    operador: "",
    estado: "",
    tipoExperticia: "",
    search: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch experticias with proper query params
  const { data: experticiasData, isLoading } = useQuery({
    queryKey: ["/api/experticias", currentPage, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== "all")
        ),
      });
      
      return await apiRequest(`/api/experticias?${params}`, {
        method: "GET",
      });
    },
  });

  const experticias = experticiasData?.experticias || [];
  const total = experticiasData?.total || 0;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertExperticia) => {
      return await apiRequest("/api/experticias", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experticias"] });
      toast({
        title: "Experticia creada",
        description: "La experticia ha sido creada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la experticia.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertExperticia> }) => {
      return await apiRequest(`/api/experticias/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experticias"] });
      toast({
        title: "Experticia actualizada",
        description: "La experticia ha sido actualizada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la experticia.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/experticias/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experticias"] });
      toast({
        title: "Experticia eliminada",
        description: "La experticia ha sido eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la experticia.",
        variant: "destructive",
      });
    },
  });

  const handleFiltersChange = (newFilters: Partial<ExperticiasFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta experticia?")) {
      deleteMutation.mutate(id);
    }
  };

  return {
    // Data
    experticias,
    total,
    currentPage,
    filters,
    isLoading,
    
    // Actions
    setCurrentPage,
    setFilters: handleFiltersChange,
    handleDelete,
    
    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
  };
}