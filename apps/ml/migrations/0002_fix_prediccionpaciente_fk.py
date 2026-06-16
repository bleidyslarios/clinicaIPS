# Manually created to fix FK after migration 0002
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ml', '0001_initial'),
        ('etl', '0002_remove_paciente_id_alter_paciente_id_paciente'),
    ]

    operations = [
        migrations.AlterField(
            model_name='prediccionpaciente',
            name='paciente',
            field=models.ForeignKey(
                on_delete=models.CASCADE,
                related_name='predicciones',
                to='etl.paciente',
                to_field='id_paciente',
            ),
        ),
    ]
