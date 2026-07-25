from django.db import models
from django.contrib.auth.models import User

# Extensão do perfil do usuário (funciona tanto para Cliente quanto para Admin do Lava-Rápido)
class PerfilUsuario(models.Model):
    TIPO_USUARIO = (
        ('CLIENTE', 'Cliente'),
        ('ADMIN', 'Administrador do Lava-Rápido'),
    )
    GENERO_CHOICES = (
        ('M', 'Masculino'),
        ('F', 'Feminino'),
        ('O', 'Outro'),
        ('N', 'Prefiro não informar'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    tipo = models.CharField(max_length=10, choices=TIPO_USUARIO, default='CLIENTE')
    telefone = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, blank=True, null=True)
    foto_perfil = models.ImageField(upload_to='perfis/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_tipo_display()}"


# Modelo do Lava-Rápido / Estabelecimento
class Estabelecimento(models.Model):
    dono = models.ForeignKey(User, on_delete=models.CASCADE, related_name='estabelecimentos')
    nome_fantasia = models.CharField(max_length=100)
    endereco = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    descricao = models.TextField(blank=True, null=True)
    foto = models.ImageField(upload_to='estabelecimentos/', blank=True, null=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome_fantasia


# Estabelecimentos Favoritados pelos Clientes
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

    def __str__(self):
        return f"Agendamento #{self.id} - {self.cliente.username} no {self.estabelecimento}"