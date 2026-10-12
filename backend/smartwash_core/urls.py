from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

# 👈 1. Importando o settings e o static para lidar com arquivos de mídia (imagens)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('agendamentos.urls')),
    path('api/login/', obtain_auth_token, name='api_token_auth'),
]

# 👈 2. Adicionando a rota de mídia no final do arquivo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)