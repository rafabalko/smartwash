from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator


class PerfilCliente(models.Model):
    """
    Extensão do modelo padrão de usuário (User) para dados adicionais do cliente.
    """
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    telefone = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.usuario.get_full_name() or self.usuario.username} ({self.telefone})"


class Veiculo(models.Model):
    """
    Cadastra os veículos pertencentes a cada cliente.
    """
    PORTE_CHOICES = [
        ('P', 'Pequeno'),
        ('M', 'Médio'),
        ('G', 'Grande / SUV'),
    ]

    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='veiculos')
    placa = models.CharField(max_length=10, unique=True)
    modelo = models.CharField(max_length=50)
    marca = models.CharField(max_length=50)
    porte = models.CharField(max_length=1, choices=PORTE_CHOICES, default='P')

    def __str__(self):
        return f"{self.modelo} - {self.placa} ({self.get_porte_display()})"


class Servico(models.Model):
    """
    Catálogo de serviços/lavagens oferecidos pelo estabelecimento.
    """
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    duracao_em_minutos = models.IntegerField(
        validators=[MinValueValidator(15)],
        help_text="Tempo estimado do serviço em minutos (mínimo 15 min)"
    )
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nome} - R$ {self.preco} ({self.duracao_em_minutos} min)"


class ConfiguracaoLavaRapido(models.Model):
    """
    Tabela de configuração do estabelecimento para aplicar
    as regras de negócio de limite de vagas simultâneas.
    """
    limite_vagas_simultaneas = models.PositiveIntegerField(
        default=2,
        help_text="Quantidade máxima de veículos atendidos ao mesmo tempo."
    )
    horario_abertura = models.TimeField()
    horario_fechamento = models.TimeField()

    class Meta:
        verbose_name = "Configuração do Lava-Rápido"
        verbose_name_plural = "Configurações do Lava-Rápido"

    def __str__(self):
        return f"Capacidade: {self.limite_vagas_simultaneas} vagas simultâneas"


class Agendamento(models.Model):
    """
    Tabela central do sistema contendo a reserva do serviço.
    """
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('EM_LAVAGEM', 'Em Lavagem'),
        ('CONCLUIDO', 'Concluído'),
        ('CANCELADO', 'Cancelado'),
    ]

    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agendamentos')
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.CASCADE)
    data_hora_inicio = models.DateTimeField()
    data_hora_fim = models.DateTimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDENTE')
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data_hora_inicio']

    def __str__(self):
        return f"Agendamento #{self.id} - {self.cliente.username} em {self.data_hora_inicio.strftime('%d/%m/%Y %H:%M')}"