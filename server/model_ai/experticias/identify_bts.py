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

            # Configuración (se mantiene similar, pero añadimos mapeo de columnas)
            CONFIG = {
                    'DIGITEL': {
                        'hoja': 'IBM' if 'IBM' in hojas else hojas[0],
                        'salto': 28,
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
                        'hoja': 'RESULTS' if 'RESULTS' in hojas else hojas[0],
                        'salto': 1,
                        'A': 'ASUBS', 'B': 'BSUBS',
                        # AGREGAMOS ESTO para que el bucle final encuentre las columnas
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
            datos = pd.read_excel(xls, sheet_name=conf['hoja'], skiprows=conf['salto'])
            datos.columns = datos.columns.str.strip().str.upper()

            # --- SOLUCIÓN AL PROBLEMA DEL .0 Y LIMPIEZA ---
            def limpiar_telefonos(serie):
                # Convierte a string, quita el .0 al final y espacios
                return serie.astype(str).str.replace(r'\.0$', '', regex=True).str.strip()

            col_a = conf['A'].upper()
            col_b = conf['B'].upper()
            
            datos[col_a] = limpiar_telefonos(datos[col_a])
            datos[col_b] = limpiar_telefonos(datos[col_b])

            # --- SOLUCIÓN AL CONGELAMIENTO (VECTORIZACIÓN) ---
            # Filtramos solo las filas que nos interesan de golpe (sin iterrows)
            mask = (datos[col_a] == numero_objetivo_str) | (datos[col_b] == numero_objetivo_str)
            datos_interes = datos[mask].copy()

            if datos_interes.empty:
                return {'top_10': [], 'datos_crudos': []}

            # Identificar quién es el "Contacto" (el que no es el objetivo) de forma vectorial
            datos_interes['CONTACTO'] = np.where(
                datos_interes[col_a] == numero_objetivo_str, 
                datos_interes[col_b], 
                datos_interes[col_a]
            )

           # 1. Separación de Fecha y Hora (Si vienen juntas)
            if 'FECHA Y HORA' in datos_interes.columns:
                temp = datos_interes['FECHA Y HORA'].astype(str).str.split(' ', n=1, expand=True)
                datos_interes['FECHA'] = temp[0]
                datos_interes['HORA'] = temp[1]

            if operador_key == 'DIGITEL':
                datos_interes['Dirección A'] = datos_interes['UBICACION GEOGRAFICA ABONADO A'].fillna('') + " . " + datos_interes['ESTADO INICIO A'].fillna('')
                datos_interes['Dirección B'] = datos_interes['UBICACION GEOGRAFICA ABONADO B'].fillna('') + " . " + datos_interes['ESTADO INICIO B'].fillna('')
                datos_interes['Coordenadas A'] = datos_interes['LATITUD CELDAD INICIO A'].astype(str) + ", " + datos_interes['LONGITUD CELDA INICIO A'].astype(str)
                datos_interes['Coordenadas B'] = datos_interes['LATITUD CELDA INICIO B'].astype(str) + ", " + datos_interes['LONGITUD CELDA INICIO B'].astype(str)

            elif operador_key == 'MOVISTAR':
                datos_interes['Tipo Transacción'] = datos_interes['TIPO_CDR'].fillna('') + " . " + datos_interes['TRANSACCION'].fillna('')
                datos_interes['BTS-Celda'] = datos_interes['DIRECCION_INICIAL_A'].astype(str).str.split('-').str[0]
                datos_interes['Coordenadas A'] = datos_interes['LATITUD_INICIAL_A'].astype(str) + ", " + datos_interes['LONGITUD_INICIAL_A'].astype(str)
                datos_interes['Coordenadas B'] = datos_interes['LATITUD_INICIAL_B'].astype(str) + ", " + datos_interes['LONGITUD_INICIAL_B'].astype(str)

            elif operador_key == 'MOVILNET':
                # (Aquí mantienes la lógica de SMS que ya tenías)
                es_sms = datos_interes['DURACIÓN'].astype(str).str.upper().str.contains('SMS')
                es_saliente = datos_interes[col_a] == numero_objetivo_str
                datos_interes['TIPO TRANSACCIÓN'] = np.where(
                    es_sms, 
                    np.where(es_saliente, "SMS SALIENTE", "SMS ENTRANTE"),
                    np.where(es_saliente, "LLAMADA SALIENTE", "LLAMADA ENTRANTE")
                )
                datos_interes['TIME'] = datos_interes['DURACIÓN'].astype(str).str.replace('SMS', '', case=False).str.strip()
            # --- CÁLCULO DE FRECUENCIAS (SÚPER RÁPIDO) ---
            frecuencias = datos_interes.groupby('CONTACTO').agg(
                frecuencia=('CONTACTO', 'size'),
                primera_fecha=('FECHA', 'min'),
                ultima_fecha=('FECHA', 'max')
            ).reset_index().sort_values(by='frecuencia', ascending=False)

            top_10_list = frecuencias.head(10).rename(columns={'CONTACTO': 'numero'}).to_dict('records')

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


