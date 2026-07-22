from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VeiculoViewSet, ServicoViewSet, ConfiguracaoLavaRapidoViewSet, AgendamentoViewSet

router = DefaultRouter()
router.register(r'veiculos', VeiculoViewSet, basename='veiculo')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'configuracao', ConfiguracaoLavaRapidoViewSet, basename='configuracao')
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')

urlpatterns = [
    path('', include(router.urls)),
]