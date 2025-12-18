import pandas as pd
from tabulate import tabulate
from collections import defaultdict


class BTSIdentifier:

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


class CFidentificar:
    """
    Clase para análisis de contactos frecuentes.
    
    Determina TODOS los números que se comunican con un número objetivo
    y retorna los 10 números con mayor frecuencia de comunicación.
    
    Diferencia vs BTSIdentifier:
    - BTSIdentifier: Busca quién llamó a un número (ABONADO B)
    - CFidentificar: Busca CON cuántos números se comunica (AMBAS direcciones)
    """

    def buscar_numeros_frecuentan(self, archivo_excel: str, numero_objetivo: str,
                                  operador: str):
        """
        Busca todos los números que frecuentan/se comunican con el número objetivo.
        
        Args:
            archivo_excel: Ruta del archivo Excel
            numero_objetivo: Número objetivo a analizar (ej: 4125223014)
            operador: Operador (digitel, movistar, movilnet)
        
        Returns:
            Lista de dicts con top 10 números: 
            [{numero, frecuencia, primera_fecha, ultima_fecha}, ...]
        """
        print(
            f"[DEBUG CFidentificar] Iniciando búsqueda con archivo={archivo_excel}, numero={numero_objetivo}, operador={operador}"
        )
        
        hojas = pd.ExcelFile(archivo_excel).sheet_names
        print(f"[DEBUG CFidentificar] Hojas disponibles: {hojas}")
        
        numero_objetivo_str = str(numero_objetivo).strip()
        
        # Diccionarios para agregar datos
        numeros_contacto = defaultdict(int)
        contactos_detalle = defaultdict(list)
        
        print(f"[DEBUG CFidentificar] Verificando operador: {operador.lower()}")
        
        if 'digitel' in operador.lower():
            print(f"[DEBUG CFidentificar] Procesando como Digitel, leyendo IBM")
            
            # Intenta leer IBM primero, sino Hoja1
            sheet_name = 'IBM' if 'IBM' in hojas else 'Hoja1'
            datos = pd.read_excel(archivo_excel, sheet_name=sheet_name)
            print(f"[DEBUG CFidentificar] Datos leídos: {datos.shape} filas/columnas")
            
            # Procesar todas las filas
            for _, row in datos.iterrows():
                abonado_a = str(row.get('ABONADO A', '')).strip()
                abonado_b = str(row.get('ABONADO B', '')).strip()
                fecha = row.get('FECHA', 'N/A')
                
                # Caso 1: numero_objetivo en ABONADO A (el objetivo LLAMÓ)
                if abonado_a == numero_objetivo_str and abonado_b:
                    numeros_contacto[abonado_b] += 1
                    contactos_detalle[abonado_b].append(fecha)
                
                # Caso 2: numero_objetivo en ABONADO B (el objetivo RECIBIÓ)
                elif abonado_b == numero_objetivo_str and abonado_a:
                    numeros_contacto[abonado_a] += 1
                    contactos_detalle[abonado_a].append(fecha)
            
        elif 'movistar' in operador.lower():
            print(f"[DEBUG CFidentificar] Procesando como Movistar")
            
            if 'VOZ' not in hojas:
                print(
                    f"[DEBUG CFidentificar ERROR] La hoja 'VOZ' no existe. Hojas disponibles: {hojas}"
                )
                return None
            
            datos = pd.read_excel(archivo_excel, sheet_name='VOZ')
            print(f"[DEBUG CFidentificar] Datos VOZ leídos: {datos.shape} filas/columnas")
            
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
        
        elif 'movilnet' in operador.lower():
            print(f"[DEBUG CFidentificar] Procesando como Movilnet")
            
            if 'Results' not in hojas:
                print(
                    f"[DEBUG CFidentificar ERROR] La hoja 'Results' no existe. Hojas disponibles: {hojas}"
                )
                return None
            
            datos = pd.read_excel(archivo_excel, sheet_name='Results')
            print(f"[DEBUG CFidentificar] Datos Results leídos: {datos.shape} filas/columnas")
            
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
        
        # Validar resultados
        if not numeros_contacto:
            print(f"No se encontraron comunicaciones para el número {numero_objetivo}")
            return None
        
        # Ordenar por frecuencia descendente y obtener TOP 10
        top_10 = sorted(numeros_contacto.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Formatear resultados
        resultados = []
        for numero, frecuencia in top_10:
            fechas = sorted(contactos_detalle[numero])
            primera_fecha = fechas[0] if fechas else 'N/A'
            ultima_fecha = fechas[-1] if fechas else 'N/A'
            
            resultados.append({
                'numero': numero,
                'frecuencia': frecuencia,
                'primera_fecha': primera_fecha,
                'ultima_fecha': ultima_fecha,
                'total_comunicaciones': len(fechas)
            })
        
        # Mostrar resultados
        print(f"\n[CFidentificar] Resultados para el número {numero_objetivo}:")
        print(f"[CFidentificar] Números únicos encontrados: {len(numeros_contacto)}")
        print(f"[CFidentificar] TOP 10 números con mayor frecuencia:\n")
        
        for idx, result in enumerate(resultados, 1):
            print(f"{idx}. {result['numero']}")
            print(f"   Frecuencia: {result['frecuencia']} comunicaciones")
            print(f"   Primera: {result['primera_fecha']}")
            print(f"   Última: {result['ultima_fecha']}\n")
        
        return resultados


# Ejemplo de uso:
if __name__ == "__main__":
    operador = input("Ingrese la operador (digitel o movistar): ")
    archivo = input("Ingrese la ruta del archivo Excel: ")
    numero = input("Ingrese el número a buscar en la columna ABONADO B: ")
    identificador = BTSIdentifier()
    identificador.buscar_por_abonado_b(archivo, numero, operador)
