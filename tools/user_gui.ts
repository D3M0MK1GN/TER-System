// tools/user_gui.ts
// Funcionalidad del botón "Guía" - Generación de guía de usuario

/**
 * Genera el contenido HTML completo para la guía de usuario de TER-System
 * @returns {string} HTML completo de la guía de usuario
 */
export function generateUserGuideHTML(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guía de Usuario - TER-System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 2rem;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
        }
        .header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h2 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
            margin-top: 0;
        }
        h3 {
            color: #374151;
            margin-top: 1.5rem;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 0.5rem;
            margin: 0.5rem 0;
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
        }
        .step-list {
            counter-reset: step-counter;
        }
        .step-list li {
            counter-increment: step-counter;
            margin: 1rem 0;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 6px;
            position: relative;
            padding-left: 3rem;
        }
        .step-list li::before {
            content: counter(step-counter);
            position: absolute;
            left: 1rem;
            top: 1rem;
            background: #2563eb;
            color: white;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.8rem;
        }
        .warning {
            background: #fef3cd;
            border: 1px solid #fbbf24;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
        .warning::before {
            content: "⚠️ ";
            font-weight: bold;
        }
        .tip {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
        .tip::before {
            content: "💡 ";
            font-weight: bold;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .print-button:hover {
            background: #1d4ed8;
        }
        @media print {
            body { background: white; padding: 0; }
            .section { box-shadow: none; }
            .print-button { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">Imprimir / Guardar PDF</button>
    
    <div class="header">
        <h1><img src="/cicipc-32x32.png" className="h-15 w-15 flex-shrink-0" alt="Logo" /> TER-System</h1>
        <p>Guía de Usuario - Sistema de Gestión de Solicitudes de Telecomunicaciones</p>
    </div>

    <div class="section">
        <h2>🏠 Introducción</h2>
        <p>TER-System es un sistema integral para la gestión de solicitudes de telecomunicaciones dirigidas a operadores telefonicos del cicpc. Esta guía te ayudará a utilizar todas las funcionalidades del sistema de manera eficiente.</p>
        
        <h3>Empresas Telefonicas Soportadas</h3>
        <ul class="feature-list">
            <li><strong>Digitel:</strong> Empresa de telecomunicaciones Digitel</li>
            <li><strong>Movistar:</strong> Empresa de telecomunicaciones Movistar</li>
            <li><strong>Movilnet:</strong> Empresa de telecomunicaciones Movilnet</li>
        </ul>
    </div>

    <div class="section">
        <h2>🔐 Inicio de Sesión</h2>
        <ol class="step-list">
            <li>Ingresa tu nombre de usuario en el campo correspondiente</li>
            <li>Introduce tu contraseña</li>
            <li>Haz clic en "Iniciar Sesión"</li>
            <li>Serás redirigido al Dashboard principal</li>
        </ol>
        
        <div class="warning">
            Si tienes problemas para acceder, contacta al administrador del sistema para verificar que tu cuenta esté activa.
        </div>
    </div>

    <div class="section">
        <h2>📊 Dashboard Principal</h2>
        <p>El Dashboard te proporciona una vista general del estado del sistema:</p>
        
        <h3>Estadísticas Principales</h3>
        <ul class="feature-list">
            <li><strong>Total de Solicitudes:</strong> Número total de solicitudes en el sistema</li>
            <li><strong>Solicitudes Procesando:</strong> Solicitudes en proceso de gestión</li>
            <li><strong>Solicitudes Enviadas:</strong> Solicitudes enviadas a operadores</li>
            <li><strong>Solicitudes Respondidas:</strong> Solicitudes con respuesta recibida</li>
            <li><strong>Solicitudes Rechazadas:</strong> Solicitudes rechazadas por operadores</li>
        </ul>

        <div class="tip">
            Las estadísticas se actualizan en tiempo real cada vez que se modifica una solicitud.
        </div>
    </div>

    <div class="section">
        <h2>📝 Gestión de Solicitudes</h2>
        
        <h3>Crear Nueva Solicitud</h3>
        <ol class="step-list">
            <li>Ve a la sección "Gestión de Solicitudes"</li>
            <li>Haz clic en "Nueva Solicitud"</li>
            <li>Completa todos los campos requeridos:
                <ul>
                    <li><strong>Número de Expediente:</strong> Ejemplo: "K-25-0271-00079"</li>
                    <li><strong>Número de Solicitud:</strong> Ejemplo: "0271-1081" (debe ser único)</li>
                    <li><strong>Fiscal:</strong> Nombre del fiscal responsable</li>
                    <li><strong>Tipo de Experticia:</strong> Selecciona del menú desplegable</li>
                    <li><strong>Coordinación Solicitante:</strong> Selecciona del menú desplegable</li>
                    <li><strong>Operador:</strong> Digitel, Movistar o Movilnet</li>
                    <li><strong>Información de experticia:</strong> Datos específicos según experticia</li>
                    <li><strong>Reseña:</strong> Descripción detallada de la solicitud</li>
                </ul>
            </li>
            <li>Haz clic en "Crear Solicitud"</li>
        </ol>

        <h3>Buscar y Filtrar Solicitudes</h3>
        <ul class="feature-list">
            <li><strong>Búsqueda por texto:</strong> Busca por número de solicitud, expediente o fiscal</li>
            <li><strong>Filtro por operador:</strong> Muestra solo solicitudes de un operador específico</li>
            <li><strong>Filtro por estado:</strong> Filtra por estado de la solicitud</li>
            <li><strong>Paginación:</strong> Navega entre páginas de resultados</li>
        </ul>

        <h3>Estados de Solicitudes</h3>
        <ul class="feature-list">
            <li><strong>Enviada:</strong> Solicitud enviada al operador</li>
            <li><strong>Procesando:</strong> Solicitud en proceso interno</li>
            <li><strong>Respondida:</strong> Operador ha enviado respuesta</li>
            <li><strong>Rechazada:</strong> Solicitud rechazada por el operador</li>
        </ul>

        <div class="warning">
            Los usuarios normales y supervisores solo pueden editar solicitudes en estado "Enviada". Los administradores pueden editar solicitudes en cualquier estado.
        </div>
    </div>

    <div class="section">
        <h2>📧 Plantillas de Correo</h2>
        <p><em>Esta funcionalidad está disponible solo para administradores.</em></p>
        
        <ol class="step-list">
            <li>Ve a la sección "Plantillas de Correo"</li>
            <li>Haz clic en "Nueva Plantilla"</li>
            <li>Completa los campos:
                <ul>
                    <li><strong>Nombre:</strong> Identificador de la plantilla</li>
                    <li><strong>Operador:</strong> Empresa Telefonica a la que se dirige</li>
                    <li><strong>Asunto:</strong> Asunto del correo electrónico</li>
                    <li><strong>Cuerpo:</strong> Contenido del correo</li>
                </ul>
            </li>
            <li>Guarda la plantilla para uso futuro</li>
        </ol>

        <div class="tip">
            Puedes usar variables en las plantillas que se reemplazarán automáticamente con los datos de la solicitud.
        </div>
    </div>

    <div class="section">
        <h2>📈 Reportes</h2>
        <p>La sección de reportes te permite analizar el desempeño del sistema:</p>
        
        <ul class="feature-list">
            <li><strong>Reportes por período:</strong> Analiza solicitudes en rangos de fechas</li>
            <li><strong>Reportes por operador:</strong> Estadísticas específicas por operador</li>
            <li><strong>Reportes por estado:</strong> Distribución de solicitudes por estado</li>
            <li><strong>Exportación:</strong> Descarga reportes en diferentes formatos</li>
        </ul>
    </div>

    <div class="section">
        <h2>👥 Gestión de Usuarios</h2>
        <p><em>Esta funcionalidad está disponible solo para administradores.</em></p>
        
        <h3>Roles de Usuario</h3>
        <ul class="feature-list">
            <li><strong>Administrador:</strong> Acceso completo al sistema</li>
            <li><strong>Supervisor:</strong> Puede ver/gestionar todas las solicitudes, sin gestión de usuarios</li>
            <li><strong>Usuario:</strong> Solo puede ver/gestionar sus propias solicitudes</li>
        </ul>

        <h3>Estados de Usuario</h3>
        <ul class="feature-list">
            <li><strong>Activo:</strong> Usuario puede acceder al sistema</li>
            <li><strong>Suspendido:</strong> Acceso temporalmente restringido</li>
            <li><strong>Bloqueado:</strong> Acceso permanentemente restringido</li>
        </ul>
    </div>

    <div class="section">
        <h2>🔔 Notificaciones</h2>
        <p>El sistema te mantiene informado sobre cambios importantes:</p>
        
        <ul class="feature-list">
            <li>Cambios en el estado de tus solicitudes</li>
            <li>Respuestas recibidas de operadores</li>
            <li>Nuevas asignaciones (para supervisores)</li>
            <li>Alertas del sistema</li>
        </ul>

        <div class="tip">
            Haz clic en el ícono de campana en la barra superior para ver tus notificaciones pendientes.
        </div>
    </div>

    <div class="section">
        <h2>❓ Solución de Problemas</h2>
        
        <h3>Problemas Comunes</h3>
        <ul class="feature-list">
            <li><strong>No puedo crear una solicitud:</strong> Verifica que el número de solicitud sea único</li>
            <li><strong>No veo todas las solicitudes:</strong> Tu rol determina qué solicitudes puedes ver</li>
            <li><strong>No puedo editar una solicitud:</strong> Solo se pueden editar solicitudes en estado "Enviada" (excepto administradores)</li>
            <li><strong>No recibo notificaciones:</strong> Verifica tu conexión y refresca la página</li>
        </ul>

        <h3>Contacto</h3>
        <p>Para soporte técnico o problemas con el sistema, contacta al administrador del sistema.</p>
    </div>

    <div class="section">
        <h2>📅 Información de Versión</h2>
        <p><strong>Sistema:</strong> TER-System v3.5</p>
        <p><strong>Última actualización:</strong> Julio 24/07/2025</p>
        <p><strong>Desarrolador:</strong> Sistema Desarollado por D1killer</p>
    </div>

</body>
</html>
`;
}