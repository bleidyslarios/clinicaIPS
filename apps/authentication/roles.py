from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.contrib import messages

class RoleRequiredMixin(LoginRequiredMixin):
    allowed_roles = []
    login_url = '/login/'

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return self.handle_no_permission()
        if request.user.rol not in self.allowed_roles:
            messages.error(request, 'No tienes permisos para acceder a esta sección.')
            return redirect('/')
        return super().dispatch(request, *args, **kwargs)
