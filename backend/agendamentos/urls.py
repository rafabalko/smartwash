from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

from .views import (
    CustomAuthToken, CadastroView, ValidarCodigoEmailView, CriarNovoAdminView,
    RemoverFuncionarioView, PerfilUsuarioViewSet, EstabelecimentoViewSet,
    VeiculoViewSet, ServicoViewSet, AgendamentoViewSet, CadastroEstabelecimentoView,
    AvaliacaoViewSet, SolicitarResetSenhaView, ConfirmarResetSenhaView
)

router = DefaultRouter()
router.register(r'perfis', PerfilUsuarioViewSet, basename='perfil')
router.register(r'estabelecimentos', EstabelecimentoViewSet, basename='estabelecimento')
router.register(r'veiculos', VeiculoViewSet, basename='veiculo')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')
router.register(r'avaliacoes', AvaliacaoViewSet, basename='avaliacao')

urlpatterns = [
                  path('login/', CustomAuthToken.as_view(), name='api_login'),
                  path('cadastrar/', CadastroView.as_view(), name='api_cadastrar'),
                  path('verificar-email/', ValidarCodigoEmailView.as_view(), name='api_verificar_email'),
                  path('cadastrar-admin/', CriarNovoAdminView.as_view(), name='api_cadastrar_admin'),
                  path('cadastrar-estabelecimento/', CadastroEstabelecimentoView.as_view(),
                       name='api_cadastrar_estabelecimento'),
                  path('remover-funcionario/<int:user_id>/', RemoverFuncionarioView.as_view(),
                       name='api_remover_funcionario'),

                  path('recuperar-senha/solicitar/', SolicitarResetSenhaView.as_view(), name='solicitar_reset'),
                  path('recuperar-senha/confirmar/', ConfirmarResetSenhaView.as_view(), name='confirmar_reset'),

                  path('', include(router.urls)),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)