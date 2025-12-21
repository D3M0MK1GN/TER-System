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

    def buscar_numeros_frecuentan(self, archivo_excel: str, numero_objetivo: str,
                                  operador: str):
        """
        Busca todos los números que frecuentan/se comunican con el número objetivo.
        
        Args:
            archivo_excel: Ruta del archivo Excel
            numero_objetivo: Número objetivo a analizar (ej: 4125223014)
            operador: Operador (digitel, movistar, movilnet)
        
        Returns:
            Dict con:
            - top_10: Lista de dicts con números más frecuentes
            - datos_crudos: Lista de dicts con las primeras 6 columnas (máx 100 filas)
        """
        print(
            f"[DEBUG CFidentificar] Iniciando búsqueda con archivo={archivo_excel}, numero={numero_objetivo}, operador={operador}"
        )
        
        hojas = pd.ExcelFile(archivo_excel).sheet_names
        print(f"[DEBUG CFidentificar] Hojas disponibles: {hojas}")
        
        numero_objetivo_str = str(numero_objetivo).strip()
        operador_lower = operador.lower()
        
        # Diccionarios para agregar datos
        numeros_contacto = defaultdict(int)
        contactos_detalle = defaultdict(list)
        datos_crudos_list = []
        
        print(f"[DEBUG CFidentificar] Verificando operador: {operador_lower}")
        
        try:
            if 'digitel' in operador_lower:
                print(f"[DEBUG CFidentificar] Procesando como Digitel")
                sheet_name = 'IBM' if 'IBM' in hojas else 'Hoja1'
                datos = pd.read_excel(archivo_excel, sheet_name=sheet_name)
                # Extraer datos crudos (primeras 6 columnas)
                datos_para_crudos = datos.iloc[28:] if len(datos) > 28 else datos
                columnas_indices = [0, 3, 7, 7, 8, 10]
            elif 'movistar' in operador_lower:
                print(f"[DEBUG CFidentificar] Procesando como Movistar")
                datos = pd.read_excel(archivo_excel, sheet_name='VOZ')
                datos_para_crudos = datos.iloc[14:] if len(datos) > 14 else datos
                columnas_indices = [0, 1, 2, 3, 4, 9]
            elif 'movilnet' in operador_lower:
                print(f"[DEBUG CFidentificar] Procesando como Movilnet")
                datos = pd.read_excel(archivo_excel, sheet_name='Results')
                datos_para_crudos = datos.iloc[1:] if len(datos) > 1 else datos
                columnas_indices = [1, 2, 4, 5, 6, 9]
            else:
                print(f"[DEBUG CFidentificar ERROR] Operador no soportado: {operador}")
                return None

            # Procesar datos crudos
            datos_filtrados = datos_para_crudos.iloc[:, columnas_indices]
            datos_filtrados.columns = ['ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION']
            datos_crudos_list = datos_filtrados.head(100).to_dict('records')

            # Procesar para frecuencia
            for _, row in datos.iterrows():
                abonado_a = str(row.get('ABONADO A', '')).strip()
                abonado_b = str(row.get('ABONADO B', '')).strip()
                fecha = row.get('FECHA', 'N/A')
                
                if abonado_a == numero_objetivo_str and abonado_b:
                    numeros_contacto[abonado_b] += 1
                    contactos_detalle[abonado_b].append(fecha)
                elif abonado_b == numero_objetivo_str and abonado_a:
                    numeros_contacto[abonado_a] += 1
                    contactos_detalle[abonado_a].append(fecha)
        except Exception as e:
            print(f"[DEBUG CFidentificar ERROR] Error al procesar: {str(e)}")
            return None
        
        # Validar resultados
        if not numeros_contacto and not datos_crudos_list:
            return None
        
        # Ordenar por frecuencia descendente y obtener TOP 10
        top_10 = sorted(numeros_contacto.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Formatear resultados
        resultados_top10 = []
        for numero, frecuencia in top_10:
            fechas = sorted(contactos_detalle[numero])
            resultados_top10.append({
                'numero': numero,
                'frecuencia': frecuencia,
                'primera_fecha': fechas[0] if fechas else 'N/A',
                'ultima_fecha': fechas[-1] if fechas else 'N/A',
                'total_comunicaciones': len(fechas)
            })
        
        return {
            'top_10': resultados_top10,
            'datos_crudos': datos_crudos_list
        }


# Ejemplo de uso:
if __name__ == "__main__":
    operador = input("Ingrese la operador (digitel o movistar): ")
    archivo = input("Ingrese la ruta del archivo Excel: ")
    numero = input("Ingrese el número a buscar en la columna ABONADO B: ")
    identificador = Exper_Frecuentes()
    identificador.buscar_por_abonado_b(archivo, numero, operador)
