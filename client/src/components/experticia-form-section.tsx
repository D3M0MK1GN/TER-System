import { ReactNode } from "react";

/**
 * COMPONENTE: ExperticiasFormSection
 *
 * Wrapper reutilizable para secciones de formularios.
 * Proporciona estilo consistente (espaciado, tipografía) para agrupar
 * campos relacionados en el formulario de experticia.
 *
 * Uso:
 * <ExperticiasFormSection title="Información Básica">
 *   <FormField ... />
 *   <FormField ... />
 * </ExperticiasFormSection>
 */

interface ExperticiasFormSectionProps {
  title: string; // Título de la sección
  children: ReactNode; // Campos formulario dentro de la sección
}

export function ExperticiasFormSection({
  title,
  children,
}: ExperticiasFormSectionProps) {
  return (
    <div className="space-y-4">
      {/* Título de la sección con estilos consistentes */}
      <h3 className="text-lg font-medium">{title}</h3>
      {/* Contenido (campos de formulario) */}
      {children}
    </div>
  );
}
