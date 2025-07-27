import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Edit, Trash2, Search, Filter } from "lucide-react";
import { User } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserTableProps {
  users: User[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

export function UserTable({
  users,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  loading = false,
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const getStatusBadge = (user: User) => {
    if (!user.activo) {
      return <Badge variant="destructive">Inactivo</Badge>;
    }
    
    switch (user.status) {
      case "activo":
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
      case "suspendido":
        return (
          <div className="space-y-1">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Suspendido</Badge>
            {user.tiempoSuspension && (
              <div className="text-xs text-gray-600">
                Hasta: {new Date(user.tiempoSuspension).toLocaleDateString()}
              </div>
            )}
            {user.motivoSuspension && (
              <div className="text-xs text-gray-600 max-w-32 truncate" title={user.motivoSuspension}>
                {user.motivoSuspension}
              </div>
            )}
          </div>
        );
      case "bloqueado":
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case "admin":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Administrador</Badge>;
      case "supervisor":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Supervisor</Badge>;
      case "usuario":
        return <Badge variant="outline">Usuario</Badge>;
      default:
        return <Badge variant="outline">{rol}</Badge>;
    }
  };

  const getCoordinacionDisplay = (coordinacion: string | null | undefined) => {
    if (!coordinacion) return "No asignada";
    
    switch (coordinacion) {
      case "delitos_propiedad":
        return "Coordinacion de los Delitos Contra la Propiedad";
      case "delitos_personas":
        return "Coordinacion de los Delitos Contra las Personas";
      case "crimen_organizado":
        return "Coordinacion de los Delitos Contra la Delincuencia Organizada";
      case "delitos_vehiculos":
        return "Coordinacion de los Delitos Contra el Hurto y Robo de Vehiculo Automotor";
      default:
        return coordinacion;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "activo" && user.activo && user.status === "activo") ||
                         (statusFilter === "inactivo" && !user.activo) ||
                         (statusFilter === "suspendido" && user.status === "suspendido") ||
                         (statusFilter === "bloqueado" && user.status === "bloqueado");
    
    const matchesRole = roleFilter === "all" || user.rol === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando usuarios...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, usuario o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="suspendido">Suspendido</SelectItem>
            <SelectItem value="bloqueado">Bloqueado</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="usuario">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Usuario</TableHead>
              <TableHead className="min-w-[150px]">Nombre</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[120px]">Rol</TableHead>
              <TableHead className="min-w-[150px]">Coordinación</TableHead>
              <TableHead className="min-w-[140px]">Estado</TableHead>
              <TableHead className="min-w-[140px]">Dirección IP</TableHead>
              <TableHead className="min-w-[140px]">Último Acceso</TableHead>
              <TableHead className="min-w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.nombre}</TableCell>
                  <TableCell>{user.email || "No especificado"}</TableCell>
                  <TableCell>{getRoleBadge(user.rol || "usuario")}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {getCoordinacionDisplay(user.coordinacion)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>{user.direccionIp || "No especificada"}</TableCell>
                  <TableCell>
                    {user.ultimoAcceso 
                      ? format(new Date(user.ultimoAcceso), "dd/MM/yyyy HH:mm", { locale: es })
                      : "Nunca"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="p-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(user.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                pageNum === currentPage - 2 ||
                pageNum === currentPage + 2
              ) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Información de la paginación */}
      <div className="text-sm text-gray-500 text-center">
        Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} de {total} usuarios
      </div>
    </div>
  );
}