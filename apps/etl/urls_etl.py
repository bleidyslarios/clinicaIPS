from django.urls import path
from .views import ejecutar_etl_view, subir_dataset, historial_etl, estadisticas_etl, exportar_dataset_csv, generar_dataset_view

urlpatterns = [
    path('run/', ejecutar_etl_view, name='etl_run'),
    path('upload/', subir_dataset, name='etl_upload'),
    path('stats/', estadisticas_etl, name='etl_stats'),
    path('historial/', historial_etl, name='etl_historial'),
    path('exportar-csv/', exportar_dataset_csv, name='etl_exportar_csv'),
    path('generar-dataset/', generar_dataset_view, name='etl_generar_dataset'),
]
