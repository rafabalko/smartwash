from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PerfilUsuarioViewSet, EstabelecimentoViewSet, VeiculoViewSet, ServicoViewSet, AgendamentoViewSet

router = DefaultRouter()
router.register(r'perfil', PerfilUsuarioViewSet, basename='perfil')
router.register(r'estabelecimentos', EstabelecimentoViewSet, basename='estabelecimento')
router.register(r'veiculos', VeiculoViewSet, basename='veiculo')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')

urlpatterns = [
    path('', include(router.urls)),
]