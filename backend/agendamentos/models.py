from django.db import models
from django.contrib.auth.models import User

class Veiculo(models.Model):
    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='veiculos')
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=50)
    placa = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.modelo} ({self.placa})"

class Servico(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    duracao_em_minutos = models.IntegerField(default=30)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome

class Agendamento(models.Model):
    cliente = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agendamentos')
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)
    servico = models.ForeignKey(Servico, on_delete=models.CASCADE)
    data_hora_inicio = models.DateTimeField()

    def __str__(self):
        return f"Agendamento {self.id} - {self.cliente.username}"