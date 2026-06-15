from django.urls import path
from .views import entrenar, predecir, modelos_lista, estadisticas_ml, predicciones_lista

urlpatterns = [
    path('entrenar/', entrenar, name='ml_entrenar'),
    path('predecir/', predecir, name='ml_predecir'),
    path('stats/', estadisticas_ml, name='ml_stats'),
    path('modelos/', modelos_lista, name='ml_modelos'),
    path('predicciones/', predicciones_lista, name='ml_predicciones'),
]
