// Función para parsear campos con prefijos como "e:", "r:", "desde:", "hasta:"
export function parseWithPrefixes(input: string, prefixes: string[]): Record<string, string> {
  if (!input || typeof input !== 'string') {
    return {};
  }
  
  const result: Record<string, string> = {};
  
  prefixes.forEach(prefix => {
    // Crear patrón dinámico que busca el prefijo seguido de contenido
    // hasta encontrar otro prefijo o fin de cadena
    const otherPrefixes = prefixes.filter(p => p !== prefix).join('|');
    const pattern = otherPrefixes 
      ? new RegExp(`${prefix}:\\s*([^]*?)(?=\\s*(?:${otherPrefixes}):|$)`, 'i')
      : new RegExp(`${prefix}:\\s*([^]*)`, 'i');
    const match = input.match(pattern);
    result[prefix] = match ? match[1].trim() : '';
  });
  
  return result;
}