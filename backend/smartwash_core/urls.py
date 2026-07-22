from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.agendamentos.urls')),  # Conecta todas as APIs em /api/
]