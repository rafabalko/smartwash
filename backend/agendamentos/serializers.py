from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PerfilUsuario, Estabelecimento, Servico, Veiculo, Agendamento, Favorito, Avaliacao


class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)
    estabelecimento = serializers.PrimaryKeyRelatedField(
        queryset=Estabelecimento.objects.all(),
        required=False,
        allow_null=True
    )
    estabelecimento_id = serializers.ReadOnlyField(source='estabelecimento.id', default=None)

    class Meta:
        model = PerfilUsuario
        fields = '__all__'


class CadastroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    nome = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'nome']

    def create(self, validated_data):
        nome = validated_data.pop('nome', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=nome
        )
        PerfilUsuario.objects.create(user=user, tipo='CLIENTE')
        return user


class EstabelecimentoSerializer(serializers.ModelSerializer):
    is_favorito = serializers.SerializerMethodField()
    imagem = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Estabelecimento
        fields = [
            'id', 'nome_fantasia', 'endereco', 'telefone', 'descricao',
            'ativo', 'is_favorito', 'imagem', 'limite_carros_diario', 'vagas_simultaneas'
        ]

    def get_is_favorito(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return Favorito.objects.filter(cliente=request.user, estabelecimento=obj).exists()
        return False


class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = '__all__'


class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = '__all__'
        read_only_fields = ['cliente']


class AgendamentoSerializer(serializers.ModelSerializer):
    estabelecimento_nome = serializers.ReadOnlyField(source='estabelecimento.nome_fantasia', default='')
    servico_nome = serializers.ReadOnlyField(source='servico.nome', default='')
    veiculo_modelo = serializers.ReadOnlyField(source='veiculo.modelo', default='')
    veiculo_placa = serializers.ReadOnlyField(source='veiculo.placa', default='')

    cliente_nome = serializers.SerializerMethodField()
    cliente_telefone = serializers.ReadOnlyField(source='cliente.perfil.telefone', default='')

    avaliacao_id = serializers.ReadOnlyField(source='avaliacao.id', default=None)
    avaliacao_nota = serializers.ReadOnlyField(source='avaliacao.nota', default=None)
    avaliacao_comentario = serializers.ReadOnlyField(source='avaliacao.comentario', default='')

    class Meta:
        model = Agendamento
        fields = '__all__'
        read_only_fields = ['cliente', 'status']

    def get_cliente_nome(self, obj):
        if obj.cliente:
            if obj.cliente.first_name:
                return f"{obj.cliente.first_name} {obj.cliente.last_name}".strip()
            return obj.cliente.username
        return 'Cliente'

    def validate(self, data):
        estabelecimento = data.get('estabelecimento')
        data_hora_inicio = data.get('data_hora_inicio')

        if estabelecimento and data_hora_inicio:
            data_agendamento = data_hora_inicio.date()

            total_no_dia = Agendamento.objects.filter(
                estabelecimento=estabelecimento,
                data_hora_inicio__date=data_agendamento
            ).exclude(status='CANCELADO').count()

            if total_no_dia >= estabelecimento.limite_carros_diario:
                raise serializers.ValidationError({
                    "data_hora_inicio": f"Limite diário atingido! Este estabelecimento atende no máximo {estabelecimento.limite_carros_diario} carros por dia."
                })

            atendimentos_no_horario = Agendamento.objects.filter(
                estabelecimento=estabelecimento,
                data_hora_inicio=data_hora_inicio
            ).exclude(status='CANCELADO').count()

            if atendimentos_no_horario >= estabelecimento.vagas_simultaneas:
                raise serializers.ValidationError({
                    "data_hora_inicio": f"Horário lotado! Este estabelecimento possui {estabelecimento.vagas_simultaneas} vaga(s) simultânea(s) e todas já foram preenchidas."
                })

        return data


class AvaliacaoSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.SerializerMethodField()

    class Meta:
        model = Avaliacao
        fields = [
            'id', 'agendamento', 'cliente', 'cliente_nome',
            'estabelecimento', 'nota', 'comentario', 'data_criacao'
        ]
        read_only_fields = ['cliente', 'estabelecimento', 'data_criacao']

    def get_cliente_nome(self, obj):
        try:
            if obj.cliente and hasattr(obj.cliente, 'user') and obj.cliente.user:
                user = obj.cliente.user
                if user.first_name:
                    return f"{user.first_name} {user.last_name}".strip()
                if user.username:
                    return user.username
        except Exception:
            pass
        return 'Cliente SmartWash'