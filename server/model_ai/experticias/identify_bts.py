import pandas as pd
from tabulate import tabulate
from collections import defaultdict


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
                (resultados['DIRECCION'].astype(str).str.lower() != 'nan')]

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
                (resultados['DIRECCION'].astype(str).str.lower() != 'nan')]

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
                (resultados['DIRECCION'].astype(str).str.lower() != 'nan')]

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
                hojas = pd.ExcelFile(archivo_excel).sheet_names
                numero_objetivo_str = str(numero_objetivo).strip()
                operador_key = operador.upper()

                CONFIG = {
                    'DIGITEL': {
                        'hoja': 'IBM' if 'IBM' in hojas else hojas[0],
                        'salto': 28,
                        'ABONADO A': 'ABONADO A', 'ABONADO B': 'ABONADO B',
                        'mapeo': {
                            'ABONADO A': 'ABONADO A', 'Abonado B': 'ABONADO B',
                            'Tipo Transacción': 'TIPO DE TRANSACCION', 'Fecha': 'FECHA',
                            'Hora': 'HORA', 'Time': 'SEG', 'BTS-Celda': 'CELDA INICIO ABONADO A',
                            'Orientación A': 'ORIENTACION CELDA INICIO A', 'Orientación B': 'ORIENTACION CELDA INICIO B',
                            'IMEI A': 'IMEI ABONADO A', 'IMEI B': 'IMEI ABONADO B'
                        }
                    },
                    'MOVISTAR': {
                        'hoja': 'VOZ' if 'VOZ' in hojas else hojas[0],
                        'salto': 14,
                        'ABONADO A': 'ABONADO_A', 'ABONADO B': 'ABONADO_B',
                        'mapeo': {
                            'ABONADO A': 'ABONADO_A',
                            'Abonado B': 'ABONADO_B',
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
                        'ABONADO A': 'ASUBS', 'ABONADO B': 'BSUBS',
                        # AGREGAMOS ESTO para que el bucle final encuentre las columnas
                        'mapeo': {
                            'ABONADO A': 'ABONADO A', 'Abonado B': 'Abonado B',
                            'Tipo Transacción': 'Tipo Transacción', 'Fecha': 'Fecha',
                            'Hora': 'Hora', 'Time': 'Time', 'BTS-Celda': 'BTS-Celda',
                            'Dirección A': 'Dirección A', 'Coordenadas A': 'Coordenadas A',
                            'IMEI A': 'IMEI A', 'IMEI B': 'IMEI B'
                        }
                    }
            }

                conf = CONFIG.get(operador_key, CONFIG['DIGITEL'])

                # 1. CARGA (Ahora en el orden correcto)
                datos = pd.read_excel(archivo_excel, sheet_name=conf['hoja'], skiprows=conf['salto'])
                datos.columns = datos.columns.str.strip().str.upper()

                # 3. SEPARACIÓN DINÁMICA DE FECHA Y HORA
                if 'FECHA Y HORA' in datos.columns:
                    temp = datos['FECHA Y HORA'].astype(str).str.split(' ', n=1)
                    datos['FECHA'], datos['HORA'] = temp.str[0], temp.str[1]

                # 2. TRANSFORMACIONES (Solo después de cargar los datos)
                if operador_key == 'DIGITEL':
                    datos['DIRECCIÓN A'] = datos['UBICACION GEOGRAFICA ABONADO A'].fillna('') + " . " + datos['ESTADO INICIO A'].fillna('')
                    datos['DIRECCIÓN B'] = datos['UBICACION GEOGRAFICA ABONADO B'].fillna('') + " . " + datos['ESTADO INICIO B'].fillna('')
                    datos['COORDENADAS A'] = datos['LATITUD CELDAD INICIO A'].astype(str) + ", " + datos['LONGITUD CELDA INICIO A'].astype(str)
                    datos['COORDENADAS B'] = datos['LATITUD CELDA INICIO B'].astype(str) + ", " + datos['LONGITUD CELDA INICIO B'].astype(str)
                # 2. Lógica de transformación (debajo de la de Digitel)
                elif operador_key == 'MOVISTAR':
                    # Tipo Transacción fusionado
                    datos['Tipo Transacción'] = datos['TIPO_CDR'].fillna('') + " . " + datos['TRANSACCION'].fillna('')                   
                    # BTS-Celda: Extraer antes del guion (ej: "12345-Ccs" -> "12345")
                    datos['BTS-Celda'] = datos['DIRECCION_INICIAL_A'].astype(str).str.split('-').str[0]       
                    # Coordenadas A y B
                    datos['Coordenadas A'] = datos['LATITUD_INICIAL_A'].astype(str) + ", " + datos['LONGITUD_INICIAL_A'].astype(str)
                    datos['Coordenadas B'] = datos['LATITUD_INICIAL_B'].astype(str) + ", " + datos['LONGITUD_INICIAL_B'].astype(str)
                elif operador_key == 'MOVILNET':
                    def procesar_fila_movilnet(row):
                        # Como hiciste .upper() arriba, buscamos en MAYÚSCULAS
                        duracion_original = str(row.get('DURACIÓN', '')).upper()
                        num_a = str(row.get('ASUBS', '')).strip()
                        
                        sentido = "SALIENTE" if num_a == numero_objetivo_str else "ENTRANTE"
                        
                        if "SMS" in duracion_original:
                            time_limpio = duracion_original.replace("SMS", "").strip()
                            tipo = f"SMS {sentido}"
                        else:
                            time_limpio = duracion_original
                            tipo = f"LLAMADA {sentido}"
                            
                        return pd.Series([tipo, time_limpio])

                    # Aplicamos a 'datos' (no df)
                    datos[['Tipo Transacción', 'Time']] = datos.apply(procesar_fila_movilnet, axis=1)

                    # MAPEAMOS CON LOS NOMBRES EXACTOS QUE BUSCA LA TABLA (Dirección A, Coordenadas A)
                    datos['ABONADO A'] = datos.get('ASUBS', '')
                    datos['Abonado B'] = datos.get('BSUBS', '')
                    datos['Fecha'] = datos.get('FECHA', '')
                    datos['Hora'] = datos.get('HORA', '')
                    datos['BTS-Celda'] = datos.get('IROUTE', '')
                    datos['Dirección A'] = datos.get('DIROUTE', '') # Agregamos el ' A'
                    datos['Coordenadas A'] = datos.get('LAT_LON_IROUTE', '') # Agregamos el ' A'
                    datos['IMEI A'] = datos.get('IMEI A', '')
                    datos['IMEI B'] = datos.get('IMEI B', '')
                
                # 3. CONSTRUCCIÓN DE LA TABLA FINAL DE 15 COLUMNAS
                cabeceras_tabla = [
                    'ABONADO A', 'Abonado B', 'Tipo Transacción', 'Fecha', 'Hora', 'Time', 
                    'BTS-Celda', 'Dirección A', 'Dirección B', 'Coordenadas A', 'Coordenadas B', 
                    'Orientación A', 'Orientación B', 'IMEI A', 'IMEI B'
                ]

                datos_finales_lista = []
                numeros_contacto = defaultdict(int)
                contactos_detalle = defaultdict(list)
                
                col_a_key, col_b_key = conf['ABONADO A'], conf['ABONADO B']

                for _, row in datos.iterrows():
                    # Crear fila para la tabla del JSON
                    fila_tabla = {}
                    for cab in cabeceras_tabla:
                        # Si es Digitel y es una columna de las que unimos arriba
                        if operador_key == 'DIGITEL' and cab.upper() in datos.columns:
                            fila_tabla[cab] = row[cab.upper()]
                        # Si está en el mapeo
                        elif 'mapeo' in conf and cab in conf['mapeo']:
                            fila_tabla[cab] = row.get(conf['mapeo'][cab], "")
                        else:
                            fila_tabla[cab] = "" # Columna vacía si no existe para ese operador
                    
                    datos_finales_lista.append(fila_tabla)

                    # 4. LÓGICA DE FRECUENCIA
                    val_a = str(row.get(col_a_key, '')).strip()
                    val_b = str(row.get(col_b_key, '')).strip()
                    fecha = row.get('FECHA', 'N/A')

                    if val_a == numero_objetivo_str and val_b:
                        contacto = val_b
                    elif val_b == numero_objetivo_str and val_a:
                        contacto = val_a
                    else:
                        continue

                    numeros_contacto[contacto] += 1
                    contactos_detalle[contacto].append(fecha)

                # 5. RETORNO DE RESULTADOS
                top_10 = sorted(numeros_contacto.items(), key=lambda x: x[1], reverse=True)[:10]
                resultados_top10 = []
                for numero, frecuencia in top_10:
                    fechas = sorted([str(f) for f in contactos_detalle[numero]])
                    resultados_top10.append({
                        'numero': numero, 'frecuencia': frecuencia,
                        'primera_fecha': fechas[0] if fechas else 'N/A',
                        'ultima_fecha': fechas[-1] if fechas else 'N/A'
                    })
                print(datos_finales_lista[:5])  # Imprime las primeras 5 filas para verificación
                return {
                    'top_10': resultados_top10,
                    'datos_crudos': datos_finales_lista # Aquí van las 15 columnas perfectas
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
