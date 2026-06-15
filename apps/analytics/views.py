from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .services import (
    obtener_estadisticas_descriptivas, obtener_kpis,
    segmentacion_por_edad, segmentacion_por_diagnostico,
    distribucion_imc, tendencia_consultas_mensual,
    guardar_estadisticas_snapshot,
)


@extend_schema(
    tags=['analytics'],
    summary='KPIs medicos principales',
    description='Retorna total pacientes, criticos, hipertensos, diabeticos, distribucion de riesgo y promedios clinicos.',
    responses={200: {'type': 'object'}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kpis(request):
    return Response(obtener_kpis())


@extend_schema(
    tags=['analytics'],
    summary='Estadisticas descriptivas',
    description='Media, mediana, moda, desviacion estandar, min, max, Q25, Q75 de variables numericas clinicas.',
    responses={200: {'type': 'object'}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_descriptivas(request):
    return Response(obtener_estadisticas_descriptivas())


@extend_schema(
    tags=['analytics'],
    summary='Segmentacion de pacientes',
    description='Segmentacion por rango de edad, top diagnosticos y distribucion IMC.',
    responses={200: {'type': 'object'}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def segmentacion(request):
    return Response({
        'por_edad': segmentacion_por_edad(),
        'por_diagnostico': segmentacion_por_diagnostico(),
        'por_imc': distribucion_imc(),
    })


@extend_schema(
    tags=['analytics'],
    summary='Tendencia de consultas mensuales',
    description='Numero de consultas agrupadas por mes.',
    responses={200: {'type': 'object'}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tendencias(request):
    return Response({'consultas_mensuales': tendencia_consultas_mensual()})


@extend_schema(
    tags=['analytics'],
    summary='Generar snapshot de KPIs',
    description='Guarda un snapshot de los KPIs actuales en la tabla EstadisticaClinica.',
    responses={200: {'type': 'object'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_snapshot(request):
    snap = guardar_estadisticas_snapshot()
    return Response({'mensaje': 'Snapshot guardado', 'id': snap.id})
