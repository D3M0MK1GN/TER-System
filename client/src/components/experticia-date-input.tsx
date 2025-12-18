import { Input } from "@/components/ui/input";
import { handleDateInputKeyDown, CHAR_PATTERNS } from "@/lib/experticia-utils";

/**
 * COMPONENTE: ExperticiasDateInput
 *
 * Input de fecha/hora reutilizable con validación y modo lectura.
 * - Valida que solo se escriban números, barras, guiones, etc.
 * - Soporta modo "solo lectura" para usuarios sin permisos de edición
 * - Reutilizable en múltiples campos (fechas, horas, etc.)
 *
 * Uso:
 * <ExperticiasDateInput
 *   value={fecha}
 *   onChange={setFecha}
 *   pattern="dateTime"
 *   readOnly={!permissions.canEditDates}
 * />
 */

interface ExperticiasDateInputProps {
  value: string; // Valor actual del input
  onChange: (value: string) => void; // Callback cuando cambia el valor
  placeholder?: string; // Texto de ayuda (ej: "dd/mm/yyyy")
  pattern?: "dateTime" | "time" | "numeric"; // Tipo de validación a aplicar
  readOnly?: boolean; // Si está en modo solo lectura
  readOnlyLabel?: string; // Etiqueta adicional en modo lectura
}

export function ExperticiasDateInput({
  value,
  onChange,
  placeholder = "dd/mm/yyyy o dd-mm-yyyy",
  pattern = "dateTime",
  readOnly = false,
  readOnlyLabel,
}: ExperticiasDateInputProps) {
  // MODO LECTURA: mostrar valor sin permitir edición
  if (readOnly) {
    return (
      <div className="flex items-center p-3 border rounded-md bg-gray-50">
        <span className="text-sm text-gray-600">
          {value || readOnlyLabel || "No establecida"} (Solo administradores
          pueden editar)
        </span>
      </div>
    );
  }

  // MODO EDICIÓN: input con validación de caracteres
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // Valida keydown según el patrón especificado (dateTime, time, numeric)
      onKeyDown={(e) => handleDateInputKeyDown(e, CHAR_PATTERNS[pattern])}
    />
  );
}
