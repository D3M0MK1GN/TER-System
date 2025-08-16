import pandas as pd
from tabulate import tabulate

# Solicita la ruta del archivo por consola
archivo_excel = input("Ingrese la ruta del archivo Excel: ")
numero_buscar = input("Ingrese el número a buscar en la columna ABONADO B: ")

# Lee el archivo para obtener los nombres de las hojas
hojas = pd.ExcelFile(archivo_excel).sheet_names
print(f"Hojas disponibles: {hojas}")

# Verifica si la hoja 'VOZ' existe
if 'VOZ' in hojas:
    # Lee los datos de la hoja 'VOZ'
    datos_voz = pd.read_excel(archivo_excel, sheet_name='VOZ')
    # Obtiene los datos después de la fila 15 (índice 15 en pandas)
    datos_voz_despues_fila_15 = datos_voz.iloc[14:]
    # Selecciona solo la primera, segunda y quinta columna por índice
    datos_filtrados = datos_voz_despues_fila_15.iloc[:, [0, 1, 2, 3 , 4, 9]]
    
    # Renombra las columnas
    datos_filtrados.columns = ['ABONADO A', 'ABONADO B', 'FECHA','HORA', 'TIME', 'DIRECCION']
    
    # Filtra por el número ingresado en la columna 'ABONADO A'
    resultados = datos_filtrados[datos_filtrados['ABONADO B'].astype(str) == numero_buscar]
    
    if not resultados.empty:
        print(f"Resultados para el número {numero_buscar}:")
        print(resultados.head(10).to_string(index=False))
    else:
        print(f"No se encontraron resultados para el número {numero_buscar}.")
else:
    print("La hoja 'VOZ' no existe en el archivo.")

