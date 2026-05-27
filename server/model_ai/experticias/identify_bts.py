import pandas as pd
from tabulate import tabulate
from collections import defaultdict
import numpy as np

class Exper_Frecuentes:

    def buscar_por_abonado_b(self, archivo_excel: str, numero_buscar: str,
                             operador: str):
        print(
            f"[DEBUG BTS] Iniciando búsqueda con archivo={archivo_excel}, numero={numero_buscar}, operador={operador}"
        )
        hojas = pd.ExcelFile(archivo_excel).sheet_names
        print(f"[DEBUG BTS] Hojas disponibles: {hojas}")

        print(f"[DEBUG BTS] Verificando operador: {operador.lower()}")
        if 'digitel' in operador.lower():

            print(f"[DEBUG BTS] Procesando como digitel, leyendo Hoja1")
            datos_voz = pd.read_excel(archivo_excel, sheet_name='Hoja1')
            print(
                f"[DEBUG BTS] Datos leídos: {datos_voz.shape} filas/columnas")
            datos_voz_despues_fila_15 = datos_voz.iloc[28:]
            print(
                f"[DEBUG BTS] Después de fila 28: {datos_voz_despues_fila_15.shape} filas/columnas"
            )
            datos_filtrados = datos_voz_despues_fila_15.iloc[:, [
                0, 3, 7, 7, 8, 10, 15, 16
            ]]
            datos_filtrados.columns = [
                'ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION',
                'CORDENADAS', 'CORDENADAS_2'
            ]

            datos_filtrados[
                'CORDENADAS'] = datos_filtrados['CORDENADAS'].astype(
                    str) + " " + datos_filtrados['CORDENADAS_2'].astype(str)

            resultados = datos_filtrados[datos_filtrados['ABONADO B'].astype(
                str) == numero_buscar]

            resultados = resultados[
                (resultados['DIRECCION'].astype(str).str.strip() != '')
                & (resultados['DIRECCION'].astype(str).str.strip() != '-') &
                (resultados['DIRECCION'].astype(str).str.lower() != '-')]

            if resultados.empty:
                print(
                    f"No se encontraron resultados para el número {numero_buscar}."
                )
                return None

            print(f"Resultados para el número {numero_buscar}:")
            print(
                tabulate(resultados.head(10),
                         headers='keys',
                         tablefmt='psql',
                         showindex=False))
            return resultados

        elif 'movistar' in operador.lower():
            print(f"[DEBUG BTS] Procesando como Movistar")

            if 'VOZ' not in hojas:
                print(
                    f"[DEBUG BTS ERROR] La hoja 'VOZ' no existe en el archivo. Hojas disponibles: {hojas}"
                )
                return None

            print(f"[DEBUG BTS] Leyendo hoja VOZ")
            datos_voz = pd.read_excel(archivo_excel, sheet_name='VOZ')
            print(
                f"[DEBUG BTS] Datos VOZ leídos: {datos_voz.shape} filas/columnas"
            )
            datos_voz_despues_fila_15 = datos_voz.iloc[14:]
            print(
                f"[DEBUG BTS] Después de fila 14: {datos_voz_despues_fila_15.shape} filas/columnas"
            )
            datos_filtrados = datos_voz_despues_fila_15.iloc[:, [
                0, 1, 2, 3, 4, 9, 10, 11
            ]]

            datos_filtrados.columns = [
                'ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION',
                'CORDENADAS', 'CORDENADAS_2'
            ]

            datos_filtrados[
                'CORDENADAS'] = datos_filtrados['CORDENADAS'].astype(
                    str) + " " + datos_filtrados['CORDENADAS_2'].astype(str)

            resultados = datos_filtrados[datos_filtrados['ABONADO B'].astype(
                str) == numero_buscar]

            resultados = resultados[
                (resultados['DIRECCION'].astype(str).str.strip() != '')
                & (resultados['DIRECCION'].astype(str).str.strip() != '-') &
                (resultados['DIRECCION'].astype(str).str.lower() != '-')]

            if resultados.empty:
                print(
                    f"No se encontraron resultados para el número {numero_buscar}."
                )
                return None

            print(f"Resultados para el número {numero_buscar}:")
            print(
                tabulate(resultados.head(10),
                         headers='keys',
                         tablefmt='psql',
                         showindex=False))
            return resultados
        elif 'movilnet' in operador.lower():
            print(f"[DEBUG BTS] Procesando como Movilnet")

            if 'Results' not in hojas:
                print(
                    f"[DEBUG BTS ERROR] La hoja 'Results' no existe en el archivo. Hojas disponibles: {hojas}"
                )
                return None

            print(f"[DEBUG BTS] Leyendo hoja Results")
            datos_voz = pd.read_excel(archivo_excel, sheet_name='Results')
            print(
                f"[DEBUG BTS] Datos Results leídos: {datos_voz.shape} filas/columnas"
            )
            datos_voz_despues_fila_15 = datos_voz.iloc[1:]
            print(
                f"[DEBUG BTS] Después de fila 14: {datos_voz_despues_fila_15.shape} filas/columnas"
            )
            datos_filtrados = datos_voz_despues_fila_15.iloc[:, [
                1, 2, 4, 5, 6, 9, 9, 11
            ]]

            datos_filtrados.columns = [
                'ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION',
                'CORDENADAS', 'CORDENADAS_2'
            ]

            datos_filtrados[
                'CORDENADAS'] = datos_filtrados['CORDENADAS'].astype(
                    str) + " " + datos_filtrados['CORDENADAS_2'].astype(str)

            resultados = datos_filtrados[datos_filtrados['ABONADO B'].astype(
                str) == numero_buscar]

            resultados = resultados[
                (resultados['DIRECCION'].astype(str).str.strip() != '')
                & (resultados['DIRECCION'].astype(str).str.strip() != '-') &
                (resultados['DIRECCION'].astype(str).str.lower() != '-')]

            if resultados.empty:
                print(
                    f"No se encontraron resultados para el número {numero_buscar}."
                )
                return None

            print(f"Resultados para el número {numero_buscar}:")
            print(
                tabulate(resultados.head(10),
                         headers='keys',
                         tablefmt='psql',
                         showindex=False))
            return resultados

    def buscar_numeros_frecuentan(self, archivo_excel: str, numero_objetivo: str, operador: str):
        try:
            # 1. Carga inicial
            xls = pd.ExcelFile(archivo_excel)
            hojas = xls.sheet_names
            operador_key = operador.upper()
            
            # Limpieza inicial del número objetivo
            numero_objetivo_str = str(numero_objetivo).split('.')[0].strip()

            # Mapa case-insensitive: nombre en mayúsculas -> nombre real de la hoja
            hojas_upper = {h.upper(): h for h in hojas}

            # Configuración (se mantiene similar, pero añadimos mapeo de columnas)
            CONFIG = {
                    'DIGITEL': {
                        'hoja': hojas_upper.get('IBM', None),
                        'salto': 0 if 'IBM' in hojas_upper else 28,
                        'A': 'ABONADO A', 'B': 'ABONADO B',
                        'mapeo': {
                            'ABONADO A': 'ABONADO A', 'ABONADO B': 'ABONADO B',
                            'Tipo Transacción': 'TIPO DE TRANSACCION', 'Fecha': 'FECHA',
                            'Hora': 'HORA', 'Time': 'SEG', 'BTS-Celda': 'CELDA INICIO ABONADO A',
                            'Orientación A': 'ORIENTACION CELDA INICIO A', 'Orientación B': 'ORIENTACION CELDA INICIO B',
                            'IMEI A': 'IMEI ABONADO A', 'IMEI B': 'IMEI ABONADO B'
                        }
                    },
                    'MOVISTAR': {
                        'hoja': 'VOZ' if 'VOZ' in hojas else hojas[0],
                        'hoja_sms': 'SMS' if 'SMS' in hojas else None,
                        'salto': 14,
                        'A': 'ABONADO_A', 'B': 'ABONADO_B',
                        'mapeo': {
                            'ABONADO A': 'ABONADO_A',
                            'ABONADO B': 'ABONADO_B',
                            'Fecha': 'FECHA',
                            'Hora': 'HORA',
                            'Time': 'DURACION',
                            'Dirección A': 'DIRECCION_INICIAL_A',
                            'Dirección B': 'DIRECCION_INICIAL_B',
                            'IMEI A': 'IMEI_ABONADO_A',
                            'IMEI B': 'IMEI_ABONADO_B'
                        }
                    },
                    'MOVILNET': {
                        'hoja': hojas_upper.get('RESULTS', hojas[0]),
                        'hoja_sms': hojas_upper.get('SMS', None),
                        'salto': 0,
                        'A': 'ASUBS', 'B': 'BSUBS',
                        'mapeo': {
                            'ABONADO A': 'ASUBS', 'ABONADO B': 'BSUBS',
                            'Tipo Transacción': 'Tipo Transacción', 'Fecha': 'Fecha',
                            'Hora': 'Hora', 'Time': 'Time', 'BTS-Celda': 'BTS-Celda',
                            'Dirección A': 'Dirección A', 'Coordenadas A': 'Coordenadas A',
                            'IMEI A': 'IMEI A', 'IMEI B': 'IMEI B'
                        }
                    }
            }
            conf = CONFIG.get(operador_key, CONFIG['DIGITEL'])

            # Carga de datos
            if operador_key == 'DIGITEL' and conf['hoja'] is None:
                # No se encontró hoja IBM — buscar todas las hojas HojaX (case-insensitive)
                import re
                hojas_mensuales = [
                    hojas_upper[k] for k in hojas_upper
                    if re.fullmatch(r'HOJA\d+', k)
                ]
                hojas_mensuales.sort(key=lambda h: int(re.search(r'\d+', h).group()))
                if not hojas_mensuales:
                    # Último recurso: usar la primera hoja disponible
                    hojas_mensuales = [hojas[0]]
                print(f"[DEBUG BTS] Digitel sin IBM — combinando hojas: {hojas_mensuales}")
                frames = []
                for hoja in hojas_mensuales:
                    try:
                        df_hoja = pd.read_excel(xls, sheet_name=hoja, skiprows=conf['salto'])
                        df_hoja.columns = df_hoja.columns.str.strip().str.upper()
                        frames.append(df_hoja)
                        print(f"[DEBUG BTS] Hoja '{hoja}' cargada: {len(df_hoja)} filas")
                    except Exception as e_hoja:
                        print(f"[DEBUG BTS] No se pudo cargar hoja '{hoja}': {e_hoja}")
                datos = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
                print(f"[DEBUG BTS] Total filas combinadas Digitel: {len(datos)}")
            else:
                datos = pd.read_excel(xls, sheet_name=conf['hoja'], skiprows=conf['salto'])
                datos.columns = datos.columns.str.strip().str.upper()
                if operador_key == 'MOVILNET':
                    print(f"[MOVILNET] Hoja principal cargada: '{conf['hoja']}' | Filas: {len(datos)} | Columnas: {list(datos.columns)}")

            # Para Movistar: también leer la hoja SMS y combinarla
            if operador_key == 'MOVISTAR' and conf.get('hoja_sms'):
                try:
                    datos_sms = pd.read_excel(xls, sheet_name=conf['hoja_sms'], skiprows=conf['salto'])
                    datos_sms.columns = datos_sms.columns.str.strip().str.upper()
                    # Renombrar CANT_CARACTERES a DURACION para unificar estructura
                    if 'CANT_CARACTERES' in datos_sms.columns:
                        datos_sms = datos_sms.rename(columns={'CANT_CARACTERES': 'DURACION'})
                    # Parsear fechas SMS como datetime (sin convertir a string todavía)
                    datos_sms['FECHA'] = pd.to_datetime(datos_sms['FECHA'], errors='coerce')
                    # Combinar VOZ + SMS en un único DataFrame
                    datos = pd.concat([datos, datos_sms], ignore_index=True)
                    print(f"[DEBUG BTS] Hoja SMS cargada y combinada. Total filas: {len(datos)}")
                except Exception as e_sms:
                    print(f"[DEBUG BTS] No se pudo cargar hoja SMS: {e_sms}")

            # Para Movilnet: combinar hoja Results (VOZ) con hoja SMS
            if operador_key == 'MOVILNET' and conf.get('hoja_sms'):
                try:
                    datos['_TIPO_HOJA'] = 'VOZ'
                    datos_sms = pd.read_excel(xls, sheet_name=conf['hoja_sms'], skiprows=conf['salto'])
                    datos_sms.columns = datos_sms.columns.str.strip().str.upper()
                    datos_sms['_TIPO_HOJA'] = 'SMS'
                    print(f"[MOVILNET] Hoja SMS cargada: '{conf['hoja_sms']}' | Filas SMS: {len(datos_sms)} | Columnas SMS: {list(datos_sms.columns)}")
                    datos = pd.concat([datos, datos_sms], ignore_index=True)
                    print(f"[MOVILNET] Total filas combinadas (VOZ+SMS): {len(datos)}")
                except Exception as e_sms:
                    print(f"[MOVILNET] No se pudo cargar hoja SMS: {e_sms}")
                    datos['_TIPO_HOJA'] = 'VOZ'
            elif operador_key == 'MOVILNET':
                datos['_TIPO_HOJA'] = 'VOZ'
                print(f"[MOVILNET] Sin hoja SMS. Total filas VOZ: {len(datos)}")

            # --- SOLUCIÓN AL PROBLEMA DEL .0 Y LIMPIEZA ---
            def limpiar_telefonos(serie):
                # Convierte a string, quita el .0 al final y espacios
                return serie.astype(str).str.replace(r'\.0$', '', regex=True).str.strip()

            def normalizar_numero(numero):
                """Elimina el 0 inicial (prefijo nacional) si existe. No toca el prefijo 58."""
                s = str(numero).strip()
                if s.startswith('0') and not s.startswith('58'):
                    return s[1:]
                return s

            col_a = conf['A'].upper()
            col_b = conf['B'].upper()

            # LOG 3 — verificar que las columnas existen y muestra de valores
            if operador_key == 'MOVILNET':
                cols_disponibles = list(datos.columns)
                print(f"[MOVILNET] col_a='{col_a}' | col_b='{col_b}' | Columnas disponibles: {cols_disponibles}")
                if col_a in datos.columns:
                    print(f"[MOVILNET] Muestra {col_a}: {datos[col_a].head(5).tolist()}")
                else:
                    print(f"[MOVILNET] ERROR: columna '{col_a}' NO encontrada en el DataFrame")
                if col_b in datos.columns:
                    print(f"[MOVILNET] Muestra {col_b}: {datos[col_b].head(5).tolist()}")
                else:
                    print(f"[MOVILNET] ERROR: columna '{col_b}' NO encontrada en el DataFrame")

            datos[col_a] = limpiar_telefonos(datos[col_a])
            datos[col_b] = limpiar_telefonos(datos[col_b])

            # Columnas normalizadas (sin 0 inicial) para comparación — los originales se conservan
            datos['_A_NORM'] = datos[col_a].apply(normalizar_numero)
            datos['_B_NORM'] = datos[col_b].apply(normalizar_numero)

            # Normalizar también el número objetivo buscado
            numero_objetivo_norm = normalizar_numero(numero_objetivo_str)
            print(f"[DEBUG BTS] Número objetivo original: {numero_objetivo_str} | normalizado: {numero_objetivo_norm}")

            # LOG 4 — comparar número buscado vs muestra de valores normalizados
            if operador_key == 'MOVILNET':
                print(f"[MOVILNET] numero_objetivo_norm='{numero_objetivo_norm}'")
                print(f"[MOVILNET] Muestra _A_NORM: {datos['_A_NORM'].head(5).tolist()}")
                print(f"[MOVILNET] Muestra _B_NORM: {datos['_B_NORM'].head(5).tolist()}")

            # Filtrar usando las columnas normalizadas para capturar ambas formas (con/sin 0)
            mask = (datos['_A_NORM'] == numero_objetivo_norm) | (datos['_B_NORM'] == numero_objetivo_norm)
            datos_interes = datos[mask].copy()

            # LOG 5 — cuántas filas coincidieron; si 0, mostrar valores únicos para diagnóstico
            if operador_key == 'MOVILNET':
                print(f"[MOVILNET] Filas que coinciden con el número: {len(datos_interes)}")
                if datos_interes.empty:
                    unicos_a = datos['_A_NORM'].unique()[:10].tolist()
                    unicos_b = datos['_B_NORM'].unique()[:10].tolist()
                    print(f"[MOVILNET] Sin coincidencias. Valores únicos _A_NORM (muestra): {unicos_a}")
                    print(f"[MOVILNET] Sin coincidencias. Valores únicos _B_NORM (muestra): {unicos_b}")

            # Sobreescribir col_a y col_b con sus versiones normalizadas para la tabla final
            datos_interes[col_a] = datos_interes['_A_NORM']
            datos_interes[col_b] = datos_interes['_B_NORM']

            if datos_interes.empty:
                return {'top_10': [], 'datos_crudos': []}

            # Identificar quién es el "Contacto" (el que no es el objetivo) usando columnas normalizadas
            # Se usa la versión normalizada para evitar duplicados por el 0 inicial
            datos_interes['CONTACTO'] = np.where(
                datos_interes['_A_NORM'] == numero_objetivo_norm,
                datos_interes['_B_NORM'],
                datos_interes['_A_NORM']
            )

           # 1. Separación de Fecha y Hora — _FECHA_DT para cálculos, FECHA como string para salida
            if 'FECHA Y HORA' in datos_interes.columns:
                temp = datos_interes['FECHA Y HORA'].astype(str).str.split(' ', n=1, expand=True)
                datos_interes['_FECHA_DT'] = pd.to_datetime(temp[0], errors='coerce')
                datos_interes['FECHA'] = datos_interes['_FECHA_DT'].dt.strftime('%d/%m/%Y')
                datos_interes['HORA'] = temp[1]
            elif 'FECHA' in datos_interes.columns:
                # IBM ya tiene FECHA separada — guardar datetime y formatear string
                datos_interes['_FECHA_DT'] = pd.to_datetime(datos_interes['FECHA'], dayfirst=True, errors='coerce')
                datos_interes['FECHA'] = datos_interes['_FECHA_DT'].dt.strftime('%d/%m/%Y')
            else:
                datos_interes['_FECHA_DT'] = pd.NaT
                datos_interes['FECHA'] = ''

            # Solo IBM tiene columnas de ubicación/coordenadas — Hoja1/Hoja2 no las tiene
            if operador_key == 'DIGITEL' and 'UBICACION GEOGRAFICA ABONADO A' in datos_interes.columns:
                datos_interes['Dirección A'] = datos_interes['UBICACION GEOGRAFICA ABONADO A'].fillna('') + " . " + datos_interes['ESTADO INICIO A'].fillna('')
                datos_interes['Dirección B'] = datos_interes['UBICACION GEOGRAFICA ABONADO B'].fillna('') + " . " + datos_interes['ESTADO INICIO B'].fillna('')
                lat_a = datos_interes['LATITUD CELDAD INICIO A'].fillna('').astype(str).str.replace(r'^nan$', '', regex=True)
                lon_a = datos_interes['LONGITUD CELDA INICIO A'].fillna('').astype(str).str.replace(r'^nan$', '', regex=True)
                datos_interes['Coordenadas A'] = np.where((lat_a != '') & (lon_a != ''), lat_a + ', ' + lon_a, '')
                lat_b = datos_interes['LATITUD CELDA INICIO B'].fillna('').astype(str).str.replace(r'^nan$', '', regex=True)
                lon_b = datos_interes['LONGITUD CELDA INICIO B'].fillna('').astype(str).str.replace(r'^nan$', '', regex=True)
                datos_interes['Coordenadas B'] = np.where((lat_b != '') & (lon_b != ''), lat_b + ', ' + lon_b, '')

            elif operador_key == 'MOVISTAR':
                datos_interes['Tipo Transacción'] = datos_interes['TIPO_CDR'].fillna('') + " . " + datos_interes['TRANSACCION'].fillna('')
                datos_interes['BTS-Celda'] = datos_interes['DIRECCION_INICIAL_A'].fillna('').astype(str).str.split('-').str[0]
                datos_interes['Coordenadas A'] = datos_interes['LATITUD_INICIAL_A'].fillna('').astype(str).replace('', 'N/D') + ", " + datos_interes['LONGITUD_INICIAL_A'].fillna('').astype(str).replace('', 'N/D')
                datos_interes['Coordenadas B'] = datos_interes['LATITUD_INICIAL_B'].fillna('').astype(str).replace('', 'N/D') + ", " + datos_interes['LONGITUD_INICIAL_B'].fillna('').astype(str).replace('', 'N/D')

            elif operador_key == 'MOVILNET':
                es_sms = datos_interes['_TIPO_HOJA'] == 'SMS'
                es_saliente = datos_interes['_A_NORM'] == numero_objetivo_norm
                datos_interes['TIPO TRANSACCIÓN'] = np.where(
                    es_sms,
                    np.where(es_saliente, "SMS SALIENTE", "SMS ENTRANTE"),
                    np.where(es_saliente, "LLAMADA SALIENTE", "LLAMADA ENTRANTE")
                )
                col_dur = 'DURACIÓN' if 'DURACIÓN' in datos_interes.columns else 'DURACION'
                datos_interes['TIME'] = datos_interes[col_dur].astype(str).str.strip()
            # --- CÁLCULO DE FRECUENCIAS (SÚPER RÁPIDO) ---
            frecuencias = datos_interes.groupby('CONTACTO').agg(
                frecuencia=('CONTACTO', 'size'),
                primera_fecha=('_FECHA_DT', 'min'),
                ultima_fecha=('_FECHA_DT', 'max')
            ).reset_index().sort_values(by='frecuencia', ascending=False)
            frecuencias['primera_fecha'] = frecuencias['primera_fecha'].dt.strftime('%d/%m/%Y').fillna('-')
            frecuencias['ultima_fecha'] = frecuencias['ultima_fecha'].dt.strftime('%d/%m/%Y').fillna('-')

            # --- DESGLOSE POR TIPO DE TRANSACCIÓN ---
            def estandarizar_tipo(valor):
                v = str(valor).upper().replace('.', ' ').strip()
                es_sms = 'SMS' in v or 'MENSAJE' in v or 'MMS' in v
                es_saliente = 'SALIENTE' in v or 'OUT' in v or 'MOC' in v or 'ORIGINAT' in v
                if es_sms:
                    return 'SMS SALIENTE' if es_saliente else 'SMS ENTRANTE'
                else:
                    return 'LLAMADA SALIENTE' if es_saliente else 'LLAMADA ENTRANTE'

            col_tipo = None
            if operador_key == 'MOVILNET' and 'TIPO TRANSACCIÓN' in datos_interes.columns:
                col_tipo = 'TIPO TRANSACCIÓN'
            elif operador_key == 'MOVISTAR' and 'Tipo Transacción' in datos_interes.columns:
                col_tipo = 'Tipo Transacción'
            elif 'TIPO DE TRANSACCION' in datos_interes.columns:
                col_tipo = 'TIPO DE TRANSACCION'

            if col_tipo:
                datos_interes['_TIPO_STD'] = datos_interes[col_tipo].apply(estandarizar_tipo)
                pivot = datos_interes.groupby(['CONTACTO', '_TIPO_STD']).size().unstack(fill_value=0).reset_index()
                pivot.columns.name = None
                for cat in ['LLAMADA ENTRANTE', 'LLAMADA SALIENTE', 'SMS ENTRANTE', 'SMS SALIENTE']:
                    if cat not in pivot.columns:
                        pivot[cat] = 0
                frecuencias = frecuencias.merge(pivot, on='CONTACTO', how='left')
                for cat in ['LLAMADA ENTRANTE', 'LLAMADA SALIENTE', 'SMS ENTRANTE', 'SMS SALIENTE']:
                    frecuencias[cat] = frecuencias[cat].fillna(0).astype(int)

            top_10_list = frecuencias.rename(columns={'CONTACTO': 'numero'}).to_dict('records')

            # --- PREPARACIÓN DE TABLA FINAL ---
        
            # 1. Creamos un mapeo inverso para convertir nombres reales a nombres legibles
            # Esto convierte {'ABONADO A': 'ASUBS'} -> {'ASUBS': 'ABONADO A'}
            mapeo_inverso = {str(v).upper(): k for k, v in conf['mapeo'].items()}
            
            # 2. Renombramos las columnas del DataFrame de golpe
            datos_finales = datos_interes.rename(columns=mapeo_inverso)

            # 3. Definimos las columnas que queremos en el JSON (exactamente como están en las llaves del mapeo)
            cabeceras_tabla = [
                'ABONADO A', 'ABONADO B', 'Tipo Transacción', 'Fecha', 'Hora', 'Time',
                'BTS-Celda', 'Dirección A', 'Dirección B', 'Coordenadas A', 'Coordenadas B',
                'Orientación A', 'Orientación B', 'IMEI A', 'IMEI B'
            ]

            
            # 4. Reindexamos para asegurar el orden y limpiamos nulos
            # Si una columna no existe en ese operador, aparecerá vacía en lugar de dar error
            datos_finales_lista = datos_finales.reindex(columns=cabeceras_tabla).fillna("").to_dict('records')
            
            print(f"[DEBUG BTS] Primera fila procesada: {datos_finales_lista[0] if datos_finales_lista else 'VACIO'}")
            
            return {
                'top_10': top_10_list,
                'datos_crudos': datos_finales_lista
            }

        except Exception as e:
            print(f"[ERROR] {str(e)}")
            return None
       
# Ejemplo de uso:
if __name__ == "__main__":
    operador = input("Ingrese la operador (digitel o movistar): ")
    archivo = input("Ingrese la ruta del archivo Excel: ")
    numero = input("Ingrese el número a buscar en la columna ABONADO B: ")
    identificador = Exper_Frecuentes()
    identificador.buscar_por_abonado_b(archivo, numero, operador)


