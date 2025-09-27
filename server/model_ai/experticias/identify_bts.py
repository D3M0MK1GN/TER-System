import pandas as pd
from tabulate import tabulate


class BTSIdentifier:

    def buscar_por_abonado_b(self, archivo_excel: str, numero_buscar: str, operador: str):
        print(f"[DEBUG BTS] Iniciando búsqueda con archivo={archivo_excel}, numero={numero_buscar}, operador={operador}")
        hojas = pd.ExcelFile(archivo_excel).sheet_names
        print(f"[DEBUG BTS] Hojas disponibles: {hojas}")

        print(f"[DEBUG BTS] Verificando operador: {operador.lower()}")
        if 'digitel' not in operador.lower():

            print(f"[DEBUG BTS] Procesando como no-digitel, leyendo Hoja1")
            datos_voz = pd.read_excel(archivo_excel, sheet_name='Hoja1')
            print(f"[DEBUG BTS] Datos leídos: {datos_voz.shape} filas/columnas")
            datos_voz_despues_fila_15 = datos_voz.iloc[28:]
            print(f"[DEBUG BTS] Después de fila 28: {datos_voz_despues_fila_15.shape} filas/columnas")
            datos_filtrados = datos_voz_despues_fila_15.iloc[:, [
                0, 3, 7, 7, 8, 10
            ]]
            datos_filtrados.columns = [
                'ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION'
            ]

            resultados = datos_filtrados[datos_filtrados['ABONADO B'].astype(
                str) == numero_buscar]

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
                print(f"[DEBUG BTS ERROR] La hoja 'VOZ' no existe en el archivo. Hojas disponibles: {hojas}")
                return None

            print(f"[DEBUG BTS] Leyendo hoja VOZ")
            datos_voz = pd.read_excel(archivo_excel, sheet_name='VOZ')
            print(f"[DEBUG BTS] Datos VOZ leídos: {datos_voz.shape} filas/columnas")
            datos_voz_despues_fila_15 = datos_voz.iloc[14:]
            print(f"[DEBUG BTS] Después de fila 14: {datos_voz_despues_fila_15.shape} filas/columnas")
            datos_filtrados = datos_voz_despues_fila_15.iloc[:, [
                0, 1, 2, 3, 4, 9
            ]]
            datos_filtrados.columns = [
                'ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION'
            ]

            resultados = datos_filtrados[datos_filtrados['ABONADO B'].astype(
                str) == numero_buscar]

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
        else:
            print(f"[DEBUG BTS ERROR] Empresa no reconocida: {operador}. Actualmente solo se soporta 'digitel' y 'movistar'.")
            return None


# Ejemplo de uso:
if __name__ == "__main__":
    operador = input("Ingrese la operador (digitel o movistar): ")
    archivo = input("Ingrese la ruta del archivo Excel: ")
    numero = input("Ingrese el número a buscar en la columna ABONADO B: ")
    identificador = BTSIdentifier()
    identificador.buscar_por_abonado_b(archivo, numero, operador)
