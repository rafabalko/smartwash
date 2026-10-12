from django.contrib import admin
from .models import PerfilUsuario, Estabelecimento, Veiculo, Servico, Agendamento, Favorito

@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('user', 'tipo', 'telefone')
    list_filter = ('tipo',)
    search_fields = ('user__username', 'telefone')

@admin.register(Estabelecimento)
class EstabelecimentoAdmin(admin.ModelAdmin):
    list_display = ('nome_fantasia', 'dono', 'telefone', 'ativo')
    list_filter = ('ativo',)
    search_fields = ('nome_fantasia', 'endereco', 'cnpj')

@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'estabelecimento', 'preco', 'duracao_em_minutos', 'ativo')
    list_filter = ('estabelecimento', 'ativo')
    search_fields = ('nome',)

@admin.register(Veiculo)
class VeiculoAdmin(admin.ModelAdmin):
    list_display = ('modelo', 'placa', 'cliente')
    search_fields = ('modelo', 'placa', 'cliente__username')

@admin.register(Agendamento)
class AgendamentoAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'estabelecimento', 'servico', 'data_hora_inicio', 'status')
    list_filter = ('status', 'estabelecimento')
    search_fields = ('cliente__username', 'servico__nome')

admin.site.register(Favorito)