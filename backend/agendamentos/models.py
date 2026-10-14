import random
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class VerificacaoEmail(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    codigo = models.CharField(max_length=6)
    criado_em = models.DateTimeField(auto_now_add=True)

    def gerar_codigo(self):
        self.codigo = str(random.randint(100000, 999999))
        self.save()


class PerfilUsuario(models.Model):
    TIPO_CHOICES = (
        ('CLIENTE', 'Cliente'),
        ('ADMIN', 'Administrador'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    tipo = models.CharField(max_length=20, default='CLIENTE')
    telefone = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    genero = models.CharField(max_length=20, blank=True, null=True)
    foto_perfil = models.ImageField(upload_to='perfis/', blank=True, null=True)
    estabelecimento = models.ForeignKey('Estabelecimento', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}\n{self.tipo}"


class Estabelecimento(models.Model):
    dono = models.ForeignKey(User, on_delete=models.CASCADE, related_name='estabelecimentos')
    nome_fantasia = models.CharField(max_length=100)
    endereco = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    descricao = models.TextField(blank=True, null=True)
    imagem = models.ImageField(upload_to='estabelecimentos/', blank=True, null=True)
    ativo = models.BooleanField(default=True)

    limite_carros_diario = models.PositiveIntegerField(
        default=3,
        help_text="Máximo de carros que o lava-rápido atende por dia"
    )
    vagas_simultaneas = models.PositiveIntegerField(
        default=1,
        help_text="Quantidade de boxes/vagas para lavagem simultânea"
    )

    def __str__(self):
        return self.nome_fantasia


class Favorito(models.Model):
    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favoritos')
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('cliente', 'estabelecimento')


class Veiculo(models.Model):
    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='veiculos')
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=50)
    placa = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.modelo} ({self.placa})"


class Servico(models.Model):
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE, related_name='servicos', null=True, blank=True)
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    duracao_em_minutos = models.IntegerField(default=30)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nome} - {self.estabelecimento.nome_fantasia if self.estabelecimento else 'Geral'}"


class Agendamento(models.Model):
    STATUS_CHOICES = (
        ('PENDENTE', 'Pendente'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDO', 'Concluído'),
        ('CANCELADO', 'Cancelado'),
    )

    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agendamentos')
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE, related_name='agendamentos', null=True, blank=True)
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.CASCADE)
    data_hora_inicio = models.DateTimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDENTE')
    motivo_cancelamento = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Agendamento #{self.id} - {self.cliente.username} no {self.estabelecimento}"


class Avaliacao(models.Model):
    agendamento = models.OneToOneField(Agendamento, on_delete=models.CASCADE, related_name='avaliacao')
    cliente = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE)
    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE, related_name='avaliacoes')
    nota = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comentario = models.TextField(blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Avaliação de {self.cliente.user.username} para {self.estabelecimento.nome_fantasia} - Nota: {self.nota}'