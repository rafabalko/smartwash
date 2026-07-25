from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import PerfilUsuario, Estabelecimento, Favorito, Veiculo, Servico, Agendamento
from .serializers import (
    PerfilUsuarioSerializer, EstabelecimentoSerializer,
    VeiculoSerializer, ServicoSerializer, AgendamentoSerializer
)


class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PerfilUsuario.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        perfil, _ = PerfilUsuario.objects.get_or_create(user=request.user)
        if request.method == 'GET':
            serializer = self.get_serializer(perfil)
            return Response(serializer.data)

        serializer = self.get_serializer(perfil, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class EstabelecimentoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Estabelecimento.objects.filter(ativo=True)
    serializer_class = EstabelecimentoSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['post'])
    def favoritar(self, request, pk=None):
        estabelecimento = self.get_object()
        fav, created = Favorito.objects.get_or_create(cliente=request.user, estabelecimento=estabelecimento)
        if not created:
            fav.delete()
            return Response({'status': 'removido dos favoritos'})
        return Response({'status': 'adicionado aos favoritos'})


class VeiculoViewSet(viewsets.ModelViewSet):
    serializer_class = VeiculoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Veiculo.objects.filter(cliente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)


class ServicoViewSet(viewsets.ModelViewSet):
    serializer_class = ServicoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        est_id = self.request.query_params.get('estabelecimento')
        if est_id:
            return Servico.objects.filter(estabelecimento_id=est_id, ativo=True)
        return Servico.objects.filter(ativo=True)


class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        perfil, _ = PerfilUsuario.objects.get_or_create(user=user)

        # Se for admin de lava-rápido, vê agendamentos da loja dele
        if perfil.tipo == 'ADMIN':
            return Agendamento.objects.filter(estabelecimento__dono=user)

        # Se for cliente, vê os seus próprios agendamentos
        return Agendamento.objects.filter(cliente=user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)