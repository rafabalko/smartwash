from rest_framework import viewsets, permissions
from .models import Veiculo, Servico, Agendamento
from .serializers import VeiculoSerializer, ServicoSerializer, AgendamentoSerializer

class VeiculoViewSet(viewsets.ModelViewSet):
    serializer_class = VeiculoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Veiculo.objects.filter(cliente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)

class ServicoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Servico.objects.filter(ativo=True)
    serializer_class = ServicoSerializer
    permission_classes = [permissions.AllowAny]

class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Agendamento.objects.filter(cliente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)