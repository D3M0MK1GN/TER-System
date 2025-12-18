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

# Importar BTSIdentifier y CFidentificar
try:
    from identify_bts import BTSIdentifier, CFidentificar
except ImportError as e:
    print(f"Error importando BTSIdentifier/CFidentificar: {e}")
    BTSIdentifier = None
    CFidentificar = None

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
    operador: str

class AnalizarBTSResponse(BaseModel):
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    timestamp: str

class AnalizarContactosFrecuentesRequest(BaseModel):
    archivo_excel: str
    numero_buscar: str
    operador: str

class AnalizarContactosFrecuentesResponse(BaseModel):
    success: bool
    datos_crudos: Optional[List[Dict[str, Any]]] = None
    top_10_contactos: Optional[List[Dict[str, Any]]] = None
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
    print(f"[LOG] Iniciando consulta de cédula: nacionalidad={request.nacionalidad}, cedula={request.cedula}")
    try:
        # Validar nacionalidad
        print(f"[LOG] Validando nacionalidad: {request.nacionalidad}")
        if request.nacionalidad.upper() not in ['V', 'E']:
            print(f"[ERROR] Nacionalidad inválida: {request.nacionalidad}")
            raise HTTPException(
                status_code=400, 
                detail="Nacionalidad inválida. Use 'V' para Venezolano o 'E' para Extranjero"
            )
        
        # Validar cédula
        print(f"[LOG] Validando cédula: {request.cedula}")
        if not request.cedula.isdigit():
            print(f"[ERROR] Cédula inválida: {request.cedula}")
            raise HTTPException(
                status_code=400, 
                detail="Número de cédula inválido. Solo se permiten dígitos"
            )
        
        nacionalidad = request.nacionalidad.upper()
        cedula = request.cedula.strip()
        
        # Construir URL de la consulta
        url = f"{BASE_URL}?app_id={APP_ID}&token={TOKEN}&nacionalidad={nacionalidad}&cedula={cedula}"
        print(f"[LOG] URL de consulta construida: {url}")
        
        # Realizar la petición HTTP
        print(f"[LOG] Realizando petición HTTP a la API externa")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        print(f"[LOG] Respuesta recibida de la API externa: {data}")
        
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
        print(f"[LOG] Guardando consulta en el historial")
        logs = cargar_logs()
        logs.append(consulta_registro)
        guardar_logs(logs)
        
        print(f"[LOG] Consulta de cédula finalizada correctamente")
        return ConsultaCedulaResponse(
            success=True,
            data=data,
            timestamp=datetime.now().isoformat()
        )
        
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Error de conexión con la API externa: {str(e)}")
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
        print(f"[ERROR] La respuesta de la API no es un JSON válido")
        return ConsultaCedulaResponse(
            success=False,
            error="Error: La respuesta de la API no es un JSON válido",
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        print(f"[ERROR] Error interno en consulta de cédula: {str(e)}")
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
    print(f"[LOG] Iniciando análisis BTS: archivo={request.archivo_excel}, numero={request.numero_buscar}, operador={request.operador}")
    try:
        if BTSIdentifier is None:
            print(f"[ERROR] Servicio de análisis BTS no disponible")
            raise HTTPException(
                status_code=500, 
                detail="Servicio de análisis BTS no disponible"
            )
        
        # Validar que el archivo existe
        print(f"[LOG] Verificando existencia del archivo: {request.archivo_excel}")
        if not os.path.exists(request.archivo_excel):
            print(f"[ERROR] Archivo Excel no encontrado: {request.archivo_excel}")
            raise HTTPException(
                status_code=400, 
                detail="Archivo Excel no encontrado"
            )
        print(f"[LOG] Archivo encontrado correctamente")
        
        # Crear instancia de BTSIdentifier
        print(f"[LOG] Creando instancia de BTSIdentifier")
        identificador = BTSIdentifier()
        
        # Realizar análisis
        print(f"[LOG] Llamando buscar_por_abonado_b con parámetros: archivo={request.archivo_excel}, numero={request.numero_buscar}, operador={request.operador}")
        resultados = identificador.buscar_por_abonado_b(
            request.archivo_excel, 
            request.numero_buscar,
            request.operador
        )
        print(f"Operadora a consultar: {request.operador}")
        #print(f"[LOG] Resultado de análisis: tipo={type(resultados)}, empty={resultados.empty if hasattr(resultados, 'empty') else 'N/A'}")
        
        if resultados is None or resultados.empty:
            print(f"[LOG] No se encontraron resultados en el análisis BTS")
            return AnalizarBTSResponse(
                success=True,
                data=[],
                timestamp=datetime.now().isoformat()
            )
        
        # Convertir DataFrame a lista de diccionarios
        print(f"[LOG] Convirtiendo resultados a lista de diccionarios")
        resultados_list = resultados.to_dict('records')
        
        print(f"[LOG] Análisis BTS finalizado correctamente")
        return AnalizarBTSResponse(
            success=True,
            data=resultados_list,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        print(f"[ERROR] HTTPException lanzada en análisis BTS")
        raise
    except Exception as e:
        print(f"[ERROR] Excepción en análisis BTS: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return AnalizarBTSResponse(
            success=False,
            error=f"Error al analizar archivo BTS: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.post("/analizar-contactos-frecuentes", response_model=AnalizarContactosFrecuentesResponse)
async def analizar_contactos_frecuentes(request: AnalizarContactosFrecuentesRequest):
    """
    Analiza archivo Excel para determinar contactos frecuentes.
    Retorna dos conjuntos de datos:
    1. datos_crudos: Primeras 6 columnas del Excel (ABONADO A, ABONADO B, FECHA, HORA, TIME, DIRECCION)
    2. top_10_contactos: TOP 10 números con mayor frecuencia de comunicación
    """
    print(f"[LOG] Iniciando análisis Contactos Frecuentes: archivo={request.archivo_excel}, numero={request.numero_buscar}, operador={request.operador}")
    try:
        if CFidentificar is None:
            print(f"[ERROR] Servicio CFidentificar no disponible")
            raise HTTPException(
                status_code=500, 
                detail="Servicio de análisis de contactos frecuentes no disponible"
            )
        
        if not os.path.exists(request.archivo_excel):
            print(f"[ERROR] Archivo Excel no encontrado: {request.archivo_excel}")
            raise HTTPException(
                status_code=400, 
                detail="Archivo Excel no encontrado"
            )
        
        import pandas as pd
        
        hojas = pd.ExcelFile(request.archivo_excel).sheet_names
        operador = request.operador.lower()
        
        if 'digitel' in operador:
            sheet_name = 'IBM' if 'IBM' in hojas else 'Hoja1'
            datos = pd.read_excel(request.archivo_excel, sheet_name=sheet_name)
            datos_despues_fila = datos.iloc[28:] if len(datos) > 28 else datos
            columnas_indices = [0, 3, 7, 7, 8, 10]
        elif 'movistar' in operador:
            if 'VOZ' not in hojas:
                return AnalizarContactosFrecuentesResponse(
                    success=False,
                    error="La hoja 'VOZ' no existe en el archivo",
                    timestamp=datetime.now().isoformat()
                )
            datos = pd.read_excel(request.archivo_excel, sheet_name='VOZ')
            datos_despues_fila = datos.iloc[14:] if len(datos) > 14 else datos
            columnas_indices = [0, 1, 2, 3, 4, 9]
        elif 'movilnet' in operador:
            if 'Results' not in hojas:
                return AnalizarContactosFrecuentesResponse(
                    success=False,
                    error="La hoja 'Results' no existe en el archivo",
                    timestamp=datetime.now().isoformat()
                )
            datos = pd.read_excel(request.archivo_excel, sheet_name='Results')
            datos_despues_fila = datos.iloc[1:] if len(datos) > 1 else datos
            columnas_indices = [1, 2, 4, 5, 6, 9]
        else:
            return AnalizarContactosFrecuentesResponse(
                success=False,
                error=f"Operador no soportado: {request.operador}",
                timestamp=datetime.now().isoformat()
            )
        
        if len(datos_despues_fila.columns) >= max(columnas_indices) + 1:
            datos_filtrados = datos_despues_fila.iloc[:, columnas_indices]
            datos_filtrados.columns = ['ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION']
        else:
            datos_filtrados = datos_despues_fila.iloc[:, :6]
            datos_filtrados.columns = ['ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION'][:len(datos_filtrados.columns)]
        
        datos_crudos_list = datos_filtrados.head(100).to_dict('records')
        
        identificador = CFidentificar()
        top_10_resultado = identificador.buscar_numeros_frecuentan(
            request.archivo_excel,
            request.numero_buscar,
            request.operador
        )
        
        top_10_contactos = top_10_resultado if top_10_resultado else []
        
        print(f"[LOG] Análisis Contactos Frecuentes completado: {len(datos_crudos_list)} filas crudas, {len(top_10_contactos)} contactos frecuentes")
        return AnalizarContactosFrecuentesResponse(
            success=True,
            datos_crudos=datos_crudos_list,
            top_10_contactos=top_10_contactos,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Excepción en análisis Contactos Frecuentes: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return AnalizarContactosFrecuentesResponse(
            success=False,
            error=f"Error al analizar contactos frecuentes: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.get("/historial-consultas", response_model=HistorialResponse)
async def obtener_historial(limit: int = 50, offset: int = 0):
    """
    Obtiene el historial de consultas realizadas
    """
    print(f"[LOG] Obteniendo historial de consultas: limit={limit}, offset={offset}")
    try:
        logs = cargar_logs()
        print(f"[LOG] Total de consultas en historial: {len(logs)}")
        
        # Ordenar por timestamp descendente (más recientes primero)
        logs_ordenados = sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True)
        print(f"[LOG] Historial ordenado por fecha")
        
        # Aplicar paginación
        consultas_paginadas = logs_ordenados[offset:offset + limit]
        print(f"[LOG] Historial paginado: {len(consultas_paginadas)} registros devueltos")
        
        return HistorialResponse(
            consultas=consultas_paginadas,
            total=len(logs)
        )
        
    except Exception as e:
        print(f"[ERROR] Error al obtener historial: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener historial: {str(e)}")

@app.delete("/historial-consultas")
async def limpiar_historial():
    """
    Limpia el historial de consultas
    """
    print(f"[LOG] Limpiando historial de consultas")
    try:
        guardar_logs([])
        print(f"[LOG] Historial limpiado exitosamente")
        return {"message": "Historial limpiado exitosamente", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        print(f"[ERROR] Error al limpiar historial: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al limpiar historial: {str(e)}")

@app.get("/stats")
async def obtener_estadisticas():
    """
    Obtiene estadísticas de uso de la API
    """
    print(f"[LOG] Obteniendo estadísticas de uso de la API")
    try:
        logs = cargar_logs()
        print(f"[LOG] Total de consultas en logs: {len(logs)}")
        
        total_consultas = len(logs)
        consultas_exitosas = len([log for log in logs if log.get('success', False)])
        consultas_fallidas = total_consultas - consultas_exitosas
        
        # Estadísticas por nacionalidad
        venezolanos = len([log for log in logs if log.get('nacionalidad_consultada') == 'V'])
        extranjeros = len([log for log in logs if log.get('nacionalidad_consultada') == 'E'])
        
        print(f"[LOG] Estadísticas calculadas: exitosas={consultas_exitosas}, fallidas={consultas_fallidas}, venezolanos={venezolanos}, extranjeros={extranjeros}")
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
        print(f"[ERROR] Error al obtener estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")

if __name__ == "__main__":
    print("[LOG] 🚀 Iniciando TER-System OSINT API...")
    print("[LOG] 📍 Servidor corriendo en: http://localhost:5001")
    print("[LOG] 📖 Documentación disponible en: http://localhost:5001/docs")
    
    uvicorn.run(
        "api_restful:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
        log_level="info"
    )