import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Agendamento } from '../../services/api';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss'
})
export class DashboardAdminComponent implements OnInit {
  agendamentos: Agendamento[] = [];
  carregando: boolean = true;
  mensagemSucesso: string = '';
  mensagemErro: string = '';
  timeoutMensagem: any;

  faturamentoHoje: number = 0;

  // 📅 Filtro de Data e Status
  dataFiltro: string = '';
  filtroStatusAtivo: string | null = null;

  // Controle do Modal de Cancelamento
  exibirModalCancelamento: boolean = false;
  agendamentoParaCancelar: any = null;
  motivoCancelamentoText: string = '';

  statusOpcoes = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
    { label: 'Concluído', value: 'CONCLUIDO' },
    { label: 'Cancelado', value: 'CANCELADO' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.irParaHoje(); // Já vai setar a data de hoje e puxar o faturamento correto
    this.carregarAgendamentos();
  }

  // --- CONTROLE DE DATAS ---
  formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  irParaHoje(): void {
    this.dataFiltro = this.formatarDataIso(new Date());
    this.carregarFaturamento(); // 🚀 Garante que o faturamento de "hoje" recarregue
  }

  // 🚀 NOVO MÉTODO: Disparado quando o admin escolhe outro dia no calendário
  aoMudarData(): void {
    this.carregarFaturamento();
  }

  // --- MENSAGENS TEMPORÁRIAS ---
  mostrarMensagem(tipo: 'sucesso' | 'erro', texto: string): void {
    if (this.timeoutMensagem) {
      clearTimeout(this.timeoutMensagem);
    }

    if (tipo === 'sucesso') {
      this.mensagemSucesso = texto;
      this.mensagemErro = '';
    } else {
      this.mensagemErro = texto;
      this.mensagemSucesso = '';
    }

    // A mensagem some após 4 segundos (4000ms)
    this.timeoutMensagem = setTimeout(() => {
      this.mensagemSucesso = '';
      this.mensagemErro = '';
    }, 4000);
  }

  formatarStatus(status: string): string {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'CONCLUIDO': return 'Concluído';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  }

  // --- REQUISIÇÕES AO BACKEND ---
  carregarAgendamentos(): void {
    this.carregando = true;
    this.apiService.getAgendamentos().subscribe({
      next: (data: Agendamento[]) => {
        this.agendamentos = data;
        this.carregando = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar agendamentos:', err);
        this.carregando = false;
        this.mostrarMensagem('erro', 'Não foi possível carregar os agendamentos.');
      }
    });
  }

  carregarFaturamento(): void {
    // 🚀 CORREÇÃO PRINCIPAL AQUI: O método agora envia a "dataFiltro" para a API
    this.apiService.getFaturamentoDiario(this.dataFiltro).subscribe({
      next: (res: any) => {
        this.faturamentoHoje = res.faturamento_hoje || 0;
      },
      error: (err) => {
        console.error('Erro ao carregar faturamento diário', err);
      }
    });
  }

  alterarStatus(agendamento: Agendamento, novoStatus: string): void {
    if (novoStatus === 'CANCELADO') {
      this.abrirModalCancelamento(agendamento);
      return;
    }

    this.apiService.atualizarStatusAgendamento(agendamento.id, novoStatus).subscribe({
      next: (res: Agendamento) => {
        const statusFinal = res.status || novoStatus;

        this.agendamentos = this.agendamentos.map(item =>
          item.id === agendamento.id ? { ...item, status: statusFinal } : item
        );

        this.mostrarMensagem('sucesso', `Status alterado para ${this.formatarStatus(statusFinal)} com sucesso!`);
        this.carregarFaturamento(); // Atualiza o faturamento após uma alteração
      },
      error: (err: any) => {
        console.error('Erro ao alterar status:', err);
        this.mostrarMensagem('erro', err.error?.error || 'Erro ao salvar novo status no servidor.');
      }
    });
  }

  // --- MÉTODOS DO MODAL DE CANCELAMENTO ---
  abrirModalCancelamento(agendamento: Agendamento): void {
    this.agendamentoParaCancelar = agendamento;
    this.motivoCancelamentoText = '';
    this.exibirModalCancelamento = true;
  }

  fecharModalCancelamento(): void {
    this.exibirModalCancelamento = false;
    this.agendamentoParaCancelar = null;
    this.motivoCancelamentoText = '';
    this.carregarAgendamentos();
  }

  confirmarCancelamento(): void {
    if (!this.agendamentoParaCancelar) return;

    const payload = { motivo: this.motivoCancelamentoText };

    this.apiService.cancelarAgendamentoComMotivo(this.agendamentoParaCancelar.id, payload).subscribe({
      next: () => {
        this.mostrarMensagem('sucesso', 'Agendamento cancelado com sucesso!');
        this.exibirModalCancelamento = false;
        this.agendamentoParaCancelar = null;
        this.motivoCancelamentoText = '';
        this.carregarAgendamentos();
        this.carregarFaturamento();
      },
      error: (err) => {
        console.error('Erro ao cancelar:', err);
        this.mostrarMensagem('erro', err.error?.error || 'Não foi possível cancelar o agendamento.');
        this.exibirModalCancelamento = false;
        this.carregarAgendamentos();
      }
    });
  }

  // --- MÉTODOS DE FILTRAGEM (DATA E STATUS) ---

  filtrarPorStatus(status: string): void {
    this.filtroStatusAtivo = status;
  }

  limparFiltroStatus(): void {
    this.filtroStatusAtivo = null;
  }

  get agendamentosDoDia(): Agendamento[] {
    if (!this.dataFiltro) return this.agendamentos;

    return this.agendamentos.filter(a => {
      if (!a.data_hora_inicio) return false;
      const dataAgendada = a.data_hora_inicio.split('T')[0];
      return dataAgendada === this.dataFiltro;
    });
  }

  get agendamentosFiltrados(): Agendamento[] {
    let lista = this.agendamentosDoDia;
    if (this.filtroStatusAtivo) {
      lista = lista.filter(a => a.status === this.filtroStatusAtivo);
    }
    return lista;
  }

  get totalPendentes(): number { return this.agendamentosDoDia.filter(a => a.status === 'PENDENTE').length; }
  get totalEmAndamento(): number { return this.agendamentosDoDia.filter(a => a.status === 'EM_ANDAMENTO').length; }
  get totalConcluidos(): number { return this.agendamentosDoDia.filter(a => a.status === 'CONCLUIDO').length; }
  get totalCancelados(): number { return this.agendamentosDoDia.filter(a => a.status === 'CANCELADO').length; }

  // --- 📱 MÉTODOS DE FORMATAÇÃO E WHATSAPP ---

  // Formata o número para exibição: (XX) XXXXX-XXXX
  formatarTelefone(telefone: string): string {
    if (!telefone) return 'Não informado';

    // Remove tudo que não for número
    const num = telefone.replace(/\D/g, '');

    if (num.length === 11) {
      return num.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (num.length === 10) {
      return num.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }

    return telefone; // Retorna como veio se tiver tamanho diferente
  }

  // Limpa o número para o link do WhatsApp funcionar sem erros
  obterLinkWhatsApp(telefone: string): string {
    if (!telefone) return '#';
    const num = telefone.replace(/\D/g, '');
    return `https://wa.me/55${num}`;
  }
}
