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


def calcular_riesgo(edad, imc, presion_sis, presion_dis, glucosa, colesterol,
                     sat_ox, fumador, alcohol, ant_fam, act_fis, diagnostico):
    """Calcula riesgo basado en variables clínicas reales."""
    score = 0

    # Edad
    if edad > 65: score += 3
    elif edad > 50: score += 2
    elif edad > 35: score += 1

    # IMC
    if imc > 35: score += 3
    elif imc > 30: score += 2
    elif imc > 25: score += 1

    # Presión arterial
    if presion_sis >= 180 or presion_dis >= 120: score += 4
    elif presion_sis >= 140 or presion_dis >= 90: score += 2
    elif presion_sis >= 130 or presion_dis >= 85: score += 1

    # Glucosa
    if glucosa >= 200: score += 4
    elif glucosa >= 126: score += 3
    elif glucosa >= 100: score += 1

    # Colesterol
    if colesterol >= 280: score += 3
    elif colesterol >= 240: score += 2
    elif colesterol >= 200: score += 1

    # Saturación de oxígeno
    if sat_ox < 90: score += 3
    elif sat_ox < 93: score += 1

    # Factores de riesgo
    if fumador: score += 2
    if alcohol: score += 1
    if ant_fam: score += 1

    # Actividad física (protector)
    if act_fis == 'sedentario': score += 1
    elif act_fis == 'alta': score -= 1

    # Diagnóstico
    if diagnostico in ['insuficiencia renal', 'EPOC', 'cardiopatía']: score += 3
    elif diagnostico in ['diabetes', 'hipertensión']: score += 2
    elif diagnostico in ['obesidad', 'hipotiroidismo']: score += 1

    if score >= 12: return 'critico'
    elif score >= 7: return 'alto'
    elif score >= 4: return 'medio'
    return 'bajo'


def _generar_perfil_riesgo(tipo_riesgo):
    """Genera valores clínicos coherentes con un nivel de riesgo dado."""
    if tipo_riesgo == 'critico':
        return {
            'edad': random.randint(60, 90),
            'peso': round(random.uniform(85, 140), 1),
            'altura': round(random.uniform(1.50, 1.85), 2),
            'presion_sis': random.randint(160, 220),
            'presion_dis': random.randint(100, 140),
            'fc': random.randint(90, 130),
            'glucosa': round(random.uniform(150, 350), 1),
            'colesterol': round(random.uniform(250, 380), 1),
            'sat_ox': round(random.uniform(82, 92), 1),
            'temp': round(random.uniform(36.0, 38.5), 1),
            'fumador': random.random() < 0.7,
            'alcohol': random.random() < 0.5,
            'ant_fam': random.random() < 0.7,
            'act_fis': random.choices(ACTIVIDADES, weights=[50, 25, 15, 10])[0],
            'diagnostico': random.choice(['insuficiencia renal', 'EPOC', 'cardiopatía', 'diabetes']),
        }
    elif tipo_riesgo == 'alto':
        return {
            'edad': random.randint(50, 75),
            'peso': round(random.uniform(78, 120), 1),
            'altura': round(random.uniform(1.52, 1.82), 2),
            'presion_sis': random.randint(140, 175),
            'presion_dis': random.randint(90, 115),
            'fc': random.randint(80, 110),
            'glucosa': round(random.uniform(120, 200), 1),
            'colesterol': round(random.uniform(220, 300), 1),
            'sat_ox': round(random.uniform(90, 95), 1),
            'temp': round(random.uniform(36.2, 37.5), 1),
            'fumador': random.random() < 0.5,
            'alcohol': random.random() < 0.35,
            'ant_fam': random.random() < 0.5,
            'act_fis': random.choices(ACTIVIDADES, weights=[40, 30, 20, 10])[0],
            'diagnostico': random.choice(['diabetes', 'hipertensión', 'cardiopatía', 'obesidad']),
        }
    elif tipo_riesgo == 'medio':
        return {
            'edad': random.randint(35, 60),
            'peso': round(random.uniform(65, 95), 1),
            'altura': round(random.uniform(1.55, 1.80), 2),
            'presion_sis': random.randint(125, 145),
            'presion_dis': random.randint(82, 95),
            'fc': random.randint(70, 95),
            'glucosa': round(random.uniform(100, 130), 1),
            'colesterol': round(random.uniform(200, 250), 1),
            'sat_ox': round(random.uniform(93, 97), 1),
            'temp': round(random.uniform(36.3, 37.0), 1),
            'fumador': random.random() < 0.3,
            'alcohol': random.random() < 0.25,
            'ant_fam': random.random() < 0.35,
            'act_fis': random.choices(ACTIVIDADES, weights=[25, 35, 30, 10])[0],
            'diagnostico': random.choice(['hipertensión', 'obesidad', 'hipotiroidismo', 'asma']),
        }
    else:  # bajo
        return {
            'edad': random.randint(18, 45),
            'peso': round(random.uniform(55, 80), 1),
            'altura': round(random.uniform(1.55, 1.85), 2),
            'presion_sis': random.randint(100, 128),
            'presion_dis': random.randint(65, 85),
            'fc': random.randint(60, 82),
            'glucosa': round(random.uniform(70, 105), 1),
            'colesterol': round(random.uniform(150, 210), 1),
            'sat_ox': round(random.uniform(95, 99), 1),
            'temp': round(random.uniform(36.3, 37.0), 1),
            'fumador': random.random() < 0.15,
            'alcohol': random.random() < 0.15,
            'ant_fam': random.random() < 0.25,
            'act_fis': random.choices(ACTIVIDADES, weights=[10, 20, 35, 35])[0],
            'diagnostico': random.choice(['paciente sano', 'asma', 'artritis', 'anemia']),
        }


def generar_dataset(n=1800):
    random.seed(42)
    np.random.seed(42)
    data = []

    # Distribución realista de riesgos: 40% bajo, 30% medio, 20% alto, 10% critico
    distribucion_riesgos = (
        ['bajo'] * 40 + ['medio'] * 30 + ['alto'] * 20 + ['critico'] * 10
    )

    for i in range(n):
        idx = 1 + i
        nombre = random.choice(['Carlos', 'Maria', 'Juan', 'Ana', 'Pedro', 'Laura', 'Luis', 'Sofia', 'Diego', 'Valentina'])
        apellido = random.choice(['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez'])
        sexo = random.choice(SEXOS)

        # Seleccionar riesgo y generar perfil clínico coherente
        riesgo = random.choice(distribucion_riesgos)
        perfil = _generar_perfil_riesgo(riesgo)

        peso = perfil['peso']
        altura = perfil['altura']
        imc = round(peso / (altura ** 2), 1) if altura > 0 else 0

        data.append([idx, nombre, apellido, perfil['edad'], sexo, peso, altura, imc,
                     perfil['presion_sis'], perfil['presion_dis'], perfil['fc'],
                     perfil['glucosa'], perfil['colesterol'], perfil['sat_ox'],
                     perfil['temp'], perfil['ant_fam'], perfil['fumador'],
                     perfil['alcohol'], perfil['act_fis'], perfil['diagnostico'],
                     riesgo, f'2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}'])

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
