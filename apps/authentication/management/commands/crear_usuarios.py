"""
Comando: python manage.py crear_usuarios
Crea los usuarios base con sus roles: administrador, medico, analista.
"""
from django.core.management.base import BaseCommand
from apps.authentication.models import Usuario


USUARIOS = [
    {
        'username': 'admin',
        'email': 'admin@healthanalytics.com',
        'password': 'admin123',
        'first_name': 'Administrador',
        'last_name': 'Sistema',
        'rol': 'administrador',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'username': 'medico',
        'email': 'medico@healthanalytics.com',
        'password': 'medico123',
        'first_name': 'Carlos',
        'last_name': 'Garcia',
        'rol': 'medico',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'analista',
        'email': 'analista@healthanalytics.com',
        'password': 'analista123',
        'first_name': 'Maria',
        'last_name': 'Rodriguez',
        'rol': 'analista',
        'is_staff': True,
        'is_superuser': False,
    },
]


class Command(BaseCommand):
    help = 'Crea los usuarios base con sus roles (admin, medico, analista)'

    def handle(self, *args, **options):
        for data in USUARIOS:
            username = data['username']
            if Usuario.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f'Usuario "{username}" ya existe. Omitiendo.'))
                continue

            password = data.pop('password')
            usuario = Usuario(**data)
            usuario.set_password(password)
            usuario.save()
            self.stdout.write(self.style.SUCCESS(
                f'Usuario "{username}" creado (rol: {usuario.rol})'
            ))

        self.stdout.write(self.style.SUCCESS('Proceso finalizado.'))
