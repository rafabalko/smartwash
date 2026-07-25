from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PerfilUsuario, Estabelecimento, Favorito, Veiculo, Servico, Agendamento

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PerfilUsuario
        fields = ['id', 'user', 'tipo', 'telefone', 'data_nascimento', 'genero', 'foto_perfil']

class EstabelecimentoSerializer(serializers.ModelSerializer):
    is_favorito = serializers.SerializerMethodField()

    class Meta:
        model = Estabelecimento
        fields = ['id', 'nome_fantasia', 'endereco', 'telefone', 'descricao', 'foto', 'ativo', 'is_favorito']

    def get_is_favorito(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorito.objects.filter(cliente=request.user, estabelecimento=obj).exists()
        return False

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = ['id', 'marca', 'modelo', 'placa']

class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'estabelecimento', 'nome', 'descricao', 'preco', 'duracao_em_minutos', 'ativo']

class AgendamentoSerializer(serializers.ModelSerializer):
    estabelecimento_nome = serializers.ReadOnlyField(source='estabelecimento.nome_fantasia')
    servico_nome = serializers.ReadOnlyField(source='servico.nome')
    veiculo_modelo = serializers.ReadOnlyField(source='veiculo.modelo')
    veiculo_placa = serializers.ReadOnlyField(source='veiculo.placa')
    cliente_nome = serializers.ReadOnlyField(source='cliente.get_full_name')

    class Meta:
        model = Agendamento
        fields = [
            'id', 'estabelecimento', 'estabelecimento_nome',
            'veiculo', 'veiculo_modelo', 'veiculo_placa',
            'servico', 'servico_nome', 'cliente_nome',
            'data_hora_inicio', 'status'
        ]