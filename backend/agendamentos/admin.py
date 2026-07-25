from django.contrib import admin
from .models import Veiculo, Servico, Agendamento

@admin.register(Veiculo)
class VeiculoAdmin(admin.ModelAdmin):
    list_display = ('id', 'modelo', 'marca', 'placa', 'cliente')
    search_fields = ('modelo', 'placa', 'cliente__username')

@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'preco', 'duracao_em_minutos', 'ativo')
    list_filter = ('ativo',)
    search_fields = ('nome',)

@admin.register(Agendamento)
class AgendamentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'veiculo', 'servico', 'data_hora_inicio')
    list_filter = ('servico', 'data_hora_inicio')
    search_fields = ('cliente__username', 'veiculo__placa')