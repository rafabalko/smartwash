from rest_framework import serializers
from django.utils import timezone
from .models import PerfilCliente, Veiculo, Servico, ConfiguracaoLavaRapido, Agendamento


class PerfilClienteSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='usuario.username', read_only=True)
    email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model = PerfilCliente
        fields = ['id', 'username', 'email', 'telefone']


class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = ['id', 'cliente', 'placa', 'modelo', 'marca', 'porte']
        read_only_fields = ['cliente']


class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'nome', 'descricao', 'preco', 'duracao_em_minutos', 'ativo']


class ConfiguracaoLavaRapidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoLavaRapido
        fields = ['id', 'limite_vagas_simultaneas', 'horario_abertura', 'horario_fechamento']


class AgendamentoSerializer(serializers.ModelSerializer):
    servico_nome = serializers.CharField(source='servico.nome', read_only=True)
    veiculo_modelo = serializers.CharField(source='veiculo.modelo', read_only=True)

    class Meta:
        model = Agendamento
        fields = [
            'id', 'cliente', 'veiculo', 'veiculo_modelo',
            'servico', 'servico_nome', 'data_hora_inicio',
            'data_hora_fim', 'status', 'criado_em'
        ]
        read_only_fields = ['cliente', 'data_hora_fim', 'status', 'criado_em']

    def validate(self, data):
        """
        REGRA DE NEGÓCIO PRINCIPAL DO TCC:
        1. Calcula o horário final estimado com base na duração do serviço.
        2. Verifica se o agendamento está dentro do horário de funcionamento.
        3. Checa o limite de vagas simultâneas no intervalo solicitado.
        """
        data_inicio = data['data_hora_inicio']
        servico = data['servico']

        # 1. Validação de data no passado
        if data_inicio < timezone.now():
            raise serializers.ValidationError("Não é possível agendar para datas/horários passados.")

        # 2. Calcular o horário de término automaticamente
        data_fim = data_inicio + timezone.timedelta(minutes=servico.duracao_em_minutos)
        data['data_hora_fim'] = data_fim

        # 3. Buscar as configurações do lava-rápido
        config = ConfiguracaoLavaRapido.objects.first()
        limite_vagas = config.limite_vagas_simultaneas if config else 2  # Padrão: 2 vagas

        # 4. Validar o horário de funcionamento
        if config:
            hora_inicio = data_inicio.time()
            hora_fim = data_fim.time()
            if hora_inicio < config.horario_abertura or hora_fim > config.horario_fechamento:
                raise serializers.ValidationError(
                    f"Horário fora do funcionamento do lava-rápido "
                    f"({config.horario_abertura.strftime('%H:%M')} às {config.horario_fechamento.strftime('%H:%M')})."
                )

        # 5. VALIDAÇÃO DE VAGAS SIMULTÂNEAS (Gargalo/Conflito de Horário)
        # Conta quantos agendamentos ativos já existem que se sobrepõem ao intervalo [data_inicio, data_fim]
        agendamentos_concorrentes = Agendamento.objects.filter(
            status__in=['PENDENTE', 'EM_LAVAGEM'],
            data_hora_inicio__lt=data_fim,
            data_hora_fim__gt=data_inicio
        ).count()

        if agendamentos_concorrentes >= limite_vagas:
            raise serializers.ValidationError(
                f"Limite de vagas atingido para este horário! "
                f"O lava-rápido já possui {agendamentos_concorrentes} de {limite_vagas} vaga(s) preenchida(s) no intervalo."
            )

        return data