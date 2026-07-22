from rest_framework import viewsets, permissions
from .models import Veiculo, Servico, ConfiguracaoLavaRapido, Agendamento
from .serializers import (
    VeiculoSerializer, ServicoSerializer,
    ConfiguracaoLavaRapidoSerializer, AgendamentoSerializer
)


class VeiculoViewSet(viewsets.ModelViewSet):
    serializer_class = VeiculoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # O cliente só enxerga os seus próprios veículos
        return Veiculo.objects.filter(cliente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)


class ServicoViewSet(viewsets.ReadOnlyModelViewSet):
    # Catálogo público de serviços para os clientes consultarem
    queryset = Servico.objects.filter(ativo=True)
    serializer_class = ServicoSerializer
    permission_classes = [permissions.AllowAny]


class ConfiguracaoLavaRapidoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ConfiguracaoLavaRapido.objects.all()
    serializer_class = ConfiguracaoLavaRapidoSerializer
    permission_classes = [permissions.AllowAny]


class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Se for admin/staff vê todos os agendamentos, se for cliente comum vê só os seus
        if user.is_staff:
            return Agendamento.objects.all()
        return Agendamento.objects.filter(cliente=user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)