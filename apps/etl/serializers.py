from rest_framework import serializers
from .models import Paciente, HistorialETL


class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = '__all__'

    def validate_edad(self, value):
        if value is not None and (value < 0 or value > 130):
            raise serializers.ValidationError("La edad debe estar entre 0 y 130 anios.")
        return value

    def validate_peso(self, value):
        if value is not None and (value < 0.5 or value > 500):
            raise serializers.ValidationError("El peso debe estar entre 0.5 y 500 kg.")
        return value

    def validate_altura(self, value):
        if value is not None and (value < 0.2 or value > 2.8):
            raise serializers.ValidationError("La altura debe estar entre 0.2 y 2.8 metros.")
        return value

    def validate_imc(self, value):
        if value is not None and (value < 5 or value > 100):
            raise serializers.ValidationError("El IMC debe estar entre 5 y 100.")
        return value

    def validate_presion_sistolica(self, value):
        if value is not None and (value < 50 or value > 300):
            raise serializers.ValidationError("La presion sistolica debe estar entre 50 y 300 mmHg.")
        return value

    def validate_presion_diastolica(self, value):
        if value is not None and (value < 20 or value > 200):
            raise serializers.ValidationError("La presion diastolica debe estar entre 20 y 200 mmHg.")
        return value

    def validate_frecuencia_cardiaca(self, value):
        if value is not None and (value < 20 or value > 250):
            raise serializers.ValidationError("La frecuencia cardiaca debe estar entre 20 y 250 lpm.")
        return value

    def validate_glucosa(self, value):
        if value is not None and (value < 20 or value > 800):
            raise serializers.ValidationError("La glucosa debe estar entre 20 y 800 mg/dL.")
        return value

    def validate_colesterol(self, value):
        if value is not None and (value < 50 or value > 600):
            raise serializers.ValidationError("El colesterol debe estar entre 50 y 600 mg/dL.")
        return value

    def validate_saturacion_oxigeno(self, value):
        if value is not None and (value < 50 or value > 100):
            raise serializers.ValidationError("La saturacion de oxigeno debe estar entre 50 y 100%.")
        return value

    def validate_temperatura(self, value):
        if value is not None and (value < 25 or value > 45):
            raise serializers.ValidationError("La temperatura debe estar entre 25 y 45 grados Celsius.")
        return value

    def validate_sexo(self, value):
        if value is not None and value not in ('M', 'F', 'O'):
            raise serializers.ValidationError("El sexo debe ser M (Masculino), F (Femenino) u O (Otro).")
        return value

    def validate_riesgo_enfermedad(self, value):
        if value is not None and value not in ('bajo', 'medio', 'alto', 'critico'):
            raise serializers.ValidationError("El riesgo debe ser: bajo, medio, alto o critico.")
        return value


class HistorialETLSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = HistorialETL
        fields = '__all__'
