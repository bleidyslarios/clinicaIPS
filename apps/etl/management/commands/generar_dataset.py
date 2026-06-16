"""
Comando: python manage.py generar_dataset [--registros 1800]
Genera un dataset clínico simulado con errores intencionales (nulos, duplicados, outliers, tipográficos).
"""
import os, random, string
import pandas as pd
import numpy as np
from django.core.management.base import BaseCommand
from django.conf import settings

DIAGNOSTICOS = [
    'hipertensión', 'diabetes', 'cardiopatía', 'asma', 'artritis',
    'obesidad', 'hipotiroidismo', 'anemia', 'insuficiencia renal', 'EPOC',
    'hipertencion', 'diabetis', 'hipertensíon',
]
SEXOS = ['M', 'F']
ACTIVIDADES = ['sedentario', 'baja', 'media', 'alta']
RIESGOS = ['bajo', 'medio', 'alto', 'critico']

def generar_dataset(n=1800):
    random.seed(42)
    np.random.seed(42)
    data = []

    for i in range(n):
        idx = 1 + i
        nombre = random.choice(['Carlos', 'Maria', 'Juan', 'Ana', 'Pedro', 'Laura', 'Luis', 'Sofia', 'Diego', 'Valentina'])
        apellido = random.choice(['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez'])
        edad = int(np.random.normal(45, 15))
        edad = max(1, min(120, edad))
        sexo = random.choice(SEXOS)
        peso = round(np.random.normal(70, 15), 1)
        altura = round(np.random.normal(1.65, 0.1), 2)
        imc = round(peso / (altura ** 2), 1) if altura > 0 else 0
        presion_sis = int(np.random.normal(120, 15))
        presion_dis = int(np.random.normal(80, 10))
        fc = int(np.random.normal(75, 12))
        glucosa = round(np.random.normal(100, 20), 1)
        colesterol = round(np.random.normal(190, 35), 1)
        sat_ox = round(np.random.normal(96, 2), 1)
        temp = round(np.random.normal(36.5, 0.5), 1)
        ant_fam = random.choice([True, False])
        fumador = random.choice([True, False])
        alcohol = random.choice([True, False])
        act_fis = random.choice(ACTIVIDADES)
        diagnostico = random.choice(DIAGNOSTICOS)
        riesgo = random.choice(RIESGOS)
        fecha = f'2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}'

        data.append([idx, nombre, apellido, edad, sexo, peso, altura, imc,
                     presion_sis, presion_dis, fc, glucosa, colesterol,
                     sat_ox, temp, ant_fam, fumador, alcohol, act_fis,
                     diagnostico, riesgo, fecha])

    # --- Inyectar errores intencionales ---
    for _ in range(30):
        row = random.randint(0, n - 1)
        col = random.choice([5, 11, 12, 14])
        data[row][col] = None

    for _ in range(10):
        row = random.randint(0, n - 1)
        data[row][3] = str(random.choice(['Treinta', 'Cuarenta', 'Veinticinco']))

    for _ in range(8):
        row = random.randint(0, n - 1)
        data[row][8] = str(random.choice(['Alta', 'Normal', 'Baja']))

    for _ in range(5):
        row = random.randint(0, n - 1)
        data[row][5] = 420.0

    for _ in range(5):
        row = random.randint(0, n - 1)
        data[row][14] = 28.0

    for _ in range(20):
        row = random.randint(0, n - 1)
        data[row][20] = random.choice(['hipertencion', 'diabetis', 'hipertensíon'])

    duplicados = random.sample(range(n), 15)
    for d in duplicados:
        dup = data[d][:]
        dup[0] = data[d][0]
        data.append(dup)

    random.shuffle(data)

    columnas = ['id_paciente', 'nombres', 'apellidos', 'edad', 'sexo', 'peso', 'altura',
                'IMC', 'presión_sistólica', 'presión_diastólica', 'frecuencia_cardiaca',
                'glucosa', 'colesterol', 'saturación_oxígeno', 'temperatura',
                'antecedentes_familiares', 'fumador', 'consumo_alcohol', 'actividad_física',
                'diagnóstico_preliminar', 'riesgo_enfermedad', 'fecha_consulta']

    df = pd.DataFrame(data, columns=columnas)
    return df


class Command(BaseCommand):
    help = 'Genera dataset clínico simulado con errores intencionales'

    def add_arguments(self, parser):
        parser.add_argument('--registros', type=int, default=1800, help='Número de registros')

    def handle(self, *args, **options):
        n = options['registros']
        self.stdout.write(f'Generando {n} registros clínicos simulados...')
        df = generar_dataset(n)
        os.makedirs(settings.DATASETS_DIR, exist_ok=True)
        ruta = os.path.join(settings.DATASETS_DIR, 'dataset_clinico.xlsx')
        df.to_excel(ruta, index=False, engine='openpyxl')
        self.stdout.write(self.style.SUCCESS(f'Dataset generado: {ruta} ({len(df)} registros)'))
