import pandas as pd
from tabulate import tabulate

class BTSIdentifier:
    def buscar_por_abonado_b(self, archivo_excel: str, numero_buscar: str):
        hojas = pd.ExcelFile(archivo_excel).sheet_names
        print(f"Hojas disponibles: {hojas}")

        if 'VOZ' not in hojas:
            print("La hoja 'VOZ' no existe en el archivo.")
            return None

        datos_voz = pd.read_excel(archivo_excel, sheet_name='VOZ')
        datos_voz_despues_fila_15 = datos_voz.iloc[14:]
        datos_filtrados = datos_voz_despues_fila_15.iloc[:, [0, 1, 2, 3, 4, 9]]
        datos_filtrados.columns = ['ABONADO A', 'ABONADO B', 'FECHA', 'HORA', 'TIME', 'DIRECCION']

        resultados = datos_filtrados[datos_filtrados['ABONADO B'].astype(str) == numero_buscar]

        if resultados.empty:
            print(f"No se encontraron resultados para el número {numero_buscar}.")
            return None

        print(f"Resultados para el número {numero_buscar}:")
        print(tabulate(resultados.head(10), headers='keys', tablefmt='psql', showindex=False))
        return resultados

# Ejemplo de uso:
if __name__ == "__main__":
    archivo = input("Ingrese la ruta del archivo Excel: ")
    numero = input("Ingrese el número a buscar en la columna ABONADO B: ")
    identificador = BTSIdentifier()
    identificador.buscar_por_abonado_b(archivo, numero)

