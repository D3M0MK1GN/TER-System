#!/usr/bin/env python3
"""
API RESTful con FastAPI para integrar servicios Python con el sistema TER
Conecta el sistema de consulta de cédulas (infoI.py) con el chatbot del sistema principal
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import requests
import json
import os
import sys
from datetime import datetime
import uvicorn

# Agregar el directorio osintpython al path para importar infoI
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'osintpython'))

# Agregar el directorio experticias al path para importar BTSIdentifier
sys.path.append(os.path.join(os.path.dirname(__file__), 'experticias'))

# Importar funciones de infoI.py
try:
    from infoI import cargar_logs, guardar_logs, APP_ID, TOKEN, BASE_URL, LOG_FILE
except ImportError as e:
    print(f"Error importando infoI.py: {e}")
    # Valores por defecto si no se puede importar
    APP_ID = "1184"
    TOKEN = "64c2f1ca6f9abe04b74e386638816573"
    BASE_URL = "http://api.cedula.com.ve/api/v1"
    LOG_FILE = "consultas_cedulas.json"

# Importar BTSIdentifier
try:
    from identify_bts import BTSIdentifier
except ImportError as e:
    print(f"Error importando BTSIdentifier: {e}")
    BTSIdentifier = None

# Crear la aplicación FastAPI
app = FastAPI(
    title="TER-System OSINT API",
    description="API RESTful para servicios de inteligencia y consultas de cédulas venezolanas",
    version="1.0.0"
)

# Configurar CORS para permitir conexiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic para validación de datos
class ConsultaCedulaRequest(BaseModel):
    nacionalidad: str
    cedula: str

class ConsultaCedulaResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str

class HistorialResponse(BaseModel):
    consultas: List[Dict[str, Any]]
    total: int

class AnalizarBTSRequest(BaseModel):
    archivo_excel: str
    numero_buscar: str

class AnalizarBTSResponse(BaseModel):
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    timestamp: str

# Funciones auxiliares
def cargar_logs():
    """Carga las consultas existentes desde el archivo JSON."""
    log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'osintpython', LOG_FILE)
    if os.path.exists(log_path):
        with open(log_path, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def guardar_logs(logs):
    """Guarda las consultas en el archivo JSON."""
    log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'osintpython', LOG_FILE)
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(logs, f, indent=4, ensure_ascii=False)

# Endpoints de la API
@app.get("/")
async def root():
    """Endpoint raíz con información de la API"""
    return {
        "message": "TER-System OSINT API",
        "version": "1.0.0",
        "description": "API para servicios de inteligencia y consultas de cédulas",
        "endpoints": [
            "/consulta-cedula",
            "/historial-consultas",
            "/analizar-bts",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    """Endpoint de salud para verificar que la API está funcionando"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "TER-System OSINT API"
    }

@app.post("/consulta-cedula", response_model=ConsultaCedulaResponse)
async def consultar_cedula(request: ConsultaCedulaRequest):
    """
    Consulta información de una cédula venezolana
    """
    try:
        # Validar nacionalidad
        if request.nacionalidad.upper() not in ['V', 'E']:
            raise HTTPException(
                status_code=400, 
                detail="Nacionalidad inválida. Use 'V' para Venezolano o 'E' para Extranjero"
            )
        
        # Validar cédula
        if not request.cedula.isdigit():
            raise HTTPException(
                status_code=400, 
                detail="Número de cédula inválido. Solo se permiten dígitos"
            )
        
        nacionalidad = request.nacionalidad.upper()
        cedula = request.cedula.strip()
        
        # Construir URL de la consulta
        url = f"{BASE_URL}?app_id={APP_ID}&token={TOKEN}&nacionalidad={nacionalidad}&cedula={cedula}"
        
        # Realizar la petición HTTP
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # Preparar registro para el log
        consulta_registro = {
            "timestamp": datetime.now().isoformat(),
            "nacionalidad_consultada": nacionalidad,
            "cedula_consultada": cedula,
            "url_completa": url,
            "resultado_api": data,
            "success": True
        }
        
        # Guardar en el historial
        logs = cargar_logs()
        logs.append(consulta_registro)
        guardar_logs(logs)
        
        return ConsultaCedulaResponse(
            success=True,
            data=data,
            timestamp=datetime.now().isoformat()
        )
        
    except requests.exceptions.RequestException as e:
        # Error de conexión con la API externa
        error_registro = {
            "timestamp": datetime.now().isoformat(),
            "nacionalidad_consultada": request.nacionalidad.upper(),
            "cedula_consultada": request.cedula,
            "url_completa": f"{BASE_URL}?app_id={APP_ID}&token={TOKEN}&nacionalidad={request.nacionalidad.upper()}&cedula={request.cedula}",
            "error": str(e),
            "success": False
        }
        
        logs = cargar_logs()
        logs.append(error_registro)
        guardar_logs(logs)
        
        return ConsultaCedulaResponse(
            success=False,
            error=f"Error al conectar con la API: {str(e)}",
            timestamp=datetime.now().isoformat()
        )
    
    except json.JSONDecodeError:
        return ConsultaCedulaResponse(
            success=False,
            error="Error: La respuesta de la API no es un JSON válido",
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        return ConsultaCedulaResponse(
            success=False,
            error=f"Error interno: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.post("/analizar-bts", response_model=AnalizarBTSResponse)
async def analizar_bts(request: AnalizarBTSRequest):
    """
    Analiza archivo Excel BTS buscando número de abonado
    """
    try:
        if BTSIdentifier is None:
            raise HTTPException(
                status_code=500, 
                detail="Servicio de análisis BTS no disponible"
            )
        
        # Validar que el archivo existe
        if not os.path.exists(request.archivo_excel):
            raise HTTPException(
                status_code=400, 
                detail="Archivo Excel no encontrado"
            )
        
        # Crear instancia de BTSIdentifier
        identificador = BTSIdentifier()
        
        # Realizar análisis
        resultados = identificador.buscar_por_abonado_b(
            request.archivo_excel, 
            request.numero_buscar
        )
        
        if resultados is None or resultados.empty:
            return AnalizarBTSResponse(
                success=True,
                data=[],
                timestamp=datetime.now().isoformat()
            )
        
        # Convertir DataFrame a lista de diccionarios
        resultados_list = resultados.to_dict('records')
        
        return AnalizarBTSResponse(
            success=True,
            data=resultados_list,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return AnalizarBTSResponse(
            success=False,
            error=f"Error al analizar archivo BTS: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.get("/historial-consultas", response_model=HistorialResponse)
async def obtener_historial(limit: int = 50, offset: int = 0):
    """
    Obtiene el historial de consultas realizadas
    """
    try:
        logs = cargar_logs()
        
        # Ordenar por timestamp descendente (más recientes primero)
        logs_ordenados = sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Aplicar paginación
        consultas_paginadas = logs_ordenados[offset:offset + limit]
        
        return HistorialResponse(
            consultas=consultas_paginadas,
            total=len(logs)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener historial: {str(e)}")

@app.delete("/historial-consultas")
async def limpiar_historial():
    """
    Limpia el historial de consultas
    """
    try:
        guardar_logs([])
        return {"message": "Historial limpiado exitosamente", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al limpiar historial: {str(e)}")

@app.get("/stats")
async def obtener_estadisticas():
    """
    Obtiene estadísticas de uso de la API
    """
    try:
        logs = cargar_logs()
        
        total_consultas = len(logs)
        consultas_exitosas = len([log for log in logs if log.get('success', False)])
        consultas_fallidas = total_consultas - consultas_exitosas
        
        # Estadísticas por nacionalidad
        venezolanos = len([log for log in logs if log.get('nacionalidad_consultada') == 'V'])
        extranjeros = len([log for log in logs if log.get('nacionalidad_consultada') == 'E'])
        
        return {
            "total_consultas": total_consultas,
            "consultas_exitosas": consultas_exitosas,
            "consultas_fallidas": consultas_fallidas,
            "tasa_exito": round((consultas_exitosas / total_consultas * 100), 2) if total_consultas > 0 else 0,
            "consultas_venezolanos": venezolanos,
            "consultas_extranjeros": extranjeros,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")

if __name__ == "__main__":
    print("🚀 Iniciando TER-System OSINT API...")
    print("📍 Servidor corriendo en: http://localhost:5001")
    print("📖 Documentación disponible en: http://localhost:5001/docs")
    
    uvicorn.run(
        "api_restful:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
        log_level="info"
    )