// Clave para localStorage basada en el usuario actual
const getChatStorageKey = () => {
  const token = localStorage.getItem("token");
  if (!token) return "chatbot-messages-guest";
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return `chatbot-messages-${payload.id || 'unknown'}`;
  } catch {
    return "chatbot-messages-default";
  }
};

// Función para limpiar mensajes del chatbot al cerrar sesión (solo para no-admin)
export const clearChatbotMessagesOnLogout = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Verificar el rol del usuario desde el token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.rol;
    
    // Solo limpiar mensajes si NO es administrador
    if (userRole !== 'admin') {
      const storageKey = getChatStorageKey();
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    // Si hay error leyendo el token, no hacer nada
  }
};