import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Agendamento } from '../../services/api';

@Component({
  selector: 'app-historico-agendamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historico.html',
  styleUrl: './historico.scss'
})
export class HistoricoComponent implements OnInit {
  meusAgendamentos: Agendamento[] = [];
  agendamentosFiltrados: Agendamento[] = [];

  // Variáveis do Filtro
  dataInicio: string = '';
  dataFim: string = '';
  buscaRealizada: boolean = false;

  // Controle da Legenda (Sanfona)
  legendaAberta: boolean = false;

  mensagemSucesso: string = '';
  mensagemErro: string = '';
  timeoutMensagem: any;

  // Modais
  exibirModalCancelamento: boolean = false;
  agendamentoParaCancelar: any = null;
  motivoCancelamentoText: string = '';

  exibirModalAvaliacao: boolean = false;
  agendamentoParaAvaliar: any = null;
  notaAvaliacao: number = 0;
  comentarioAvaliacao: string = '';
  modoEdicaoAvaliacao: boolean = false;
  currentAvaliacaoId: number | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarMeusAgendamentos();
  }

  // 👈 Alterna o estado de abrir/fechar da legenda
  toggleLegenda(): void {
    this.legendaAberta = !this.legendaAberta;
  }

  mostrarMensagem(tipo: 'sucesso' | 'erro', texto: string): void {
    if (this.timeoutMensagem) clearTimeout(this.timeoutMensagem);
    if (tipo === 'sucesso') {
      this.mensagemSucesso = texto;
      this.mensagemErro = '';
    } else {
      this.mensagemErro = texto;
      this.mensagemSucesso = '';
    }
    this.timeoutMensagem = setTimeout(() => {
      this.mensagemSucesso = '';
      this.mensagemErro = '';
    }, 4000);
  }

  carregarMeusAgendamentos(): void {
    this.apiService.getAgendamentos().subscribe({
      next: (data) => {
        // Ordena do mais recente para o mais antigo
        this.meusAgendamentos = data.sort((a, b) =>
          new Date(b.data_hora_inicio).getTime() - new Date(a.data_hora_inicio).getTime()
        );

        if (!this.buscaRealizada) {
          // 🚀 Exibe de cara APENAS o agendamento mais recente (o recém-criado)
          if (this.meusAgendamentos.length > 0) {
            this.agendamentosFiltrados = [this.meusAgendamentos[0]];
          } else {
            this.agendamentosFiltrados = [];
          }
        } else {
          this.pesquisar();
        }
      },
      error: (err) => console.error(err)
    });
  }

  filtrarParaHoje(): void {
    const hoje = new Date().toISOString().split('T')[0];
    this.agendamentosFiltrados = this.meusAgendamentos.filter(a => {
      return a.data_hora_inicio.startsWith(hoje);
    });
  }

  pesquisar(): void {
    this.buscaRealizada = true;

    if (!this.dataInicio && !this.dataFim) {
      this.agendamentosFiltrados = this.meusAgendamentos;
      return;
    }

    this.agendamentosFiltrados = this.meusAgendamentos.filter(a => {
      const dataAgendamento = a.data_hora_inicio.split('T')[0];
      let passaInicio = true;
      let passaFim = true;

      if (this.dataInicio) passaInicio = dataAgendamento >= this.dataInicio;
      if (this.dataFim) passaFim = dataAgendamento <= this.dataFim;

      return passaInicio && passaFim;
    });
  }

  abrirModalCancelamento(agendamento: Agendamento): void {
    this.agendamentoParaCancelar = agendamento;
    this.motivoCancelamentoText = '';
    this.exibirModalCancelamento = true;
  }

  fecharModalCancelamento(): void {
    this.exibirModalCancelamento = false;
    this.agendamentoParaCancelar = null;
  }

  confirmarCancelamento(): void {
    if (!this.agendamentoParaCancelar) return;
    const payload = { motivo: this.motivoCancelamentoText };

    this.apiService.cancelarAgendamentoComMotivo(this.agendamentoParaCancelar.id, payload).subscribe({
      next: () => {
        this.mostrarMensagem('sucesso', 'Seu agendamento foi cancelado.');
        this.fecharModalCancelamento();
        this.carregarMeusAgendamentos();
      },
      error: (err) => this.mostrarMensagem('erro', 'Erro ao cancelar o agendamento.')
    });
  }

  abrirModalAvaliacao(agendamento: any): void {
    this.agendamentoParaAvaliar = agendamento;
    this.notaAvaliacao = 5;
    this.comentarioAvaliacao = '';
    this.modoEdicaoAvaliacao = false;
    this.currentAvaliacaoId = null;
    this.exibirModalAvaliacao = true;
  }

  abrirModalEditarAvaliacao(agendamento: any): void {
    console.log("DADOS DO AGENDAMENTO RECEBIDOS:", agendamento);


    this.agendamentoParaAvaliar = agendamento;
    this.modoEdicaoAvaliacao = true;
    this.currentAvaliacaoId = agendamento.avaliacao_id || null;

    // 🚀 Puxa os dados já salvos para preencher o modal de edição automaticamente
    this.notaAvaliacao = agendamento.nota || agendamento.avaliacao_nota || 5;
    this.comentarioAvaliacao = agendamento.comentario || agendamento.avaliacao_comentario || '';

    this.exibirModalAvaliacao = true;
  }

  fecharModalAvaliacao(): void {
    this.exibirModalAvaliacao = false;
    this.agendamentoParaAvaliar = null;
  }

  definirNota(nota: number): void { this.notaAvaliacao = nota; }

  salvarOuAtualizarAvaliacao(): void {
    if (this.notaAvaliacao < 1 || this.notaAvaliacao > 5) return;

    if (this.modoEdicaoAvaliacao && this.currentAvaliacaoId) {
      this.apiService.atualizarAvaliacao(this.currentAvaliacaoId, { nota: this.notaAvaliacao, comentario: this.comentarioAvaliacao }).subscribe({
        next: () => {
          this.mostrarMensagem('sucesso', 'Avaliação atualizada!');
          this.fecharModalAvaliacao();
          this.carregarMeusAgendamentos();
        }
      });
    } else {
      this.apiService.enviarAvaliacao({
        agendamento: this.agendamentoParaAvaliar.id,
        estabelecimento: this.agendamentoParaAvaliar.estabelecimento,
        nota: this.notaAvaliacao,
        comentario: this.comentarioAvaliacao
      }).subscribe({
        next: () => {
          this.mostrarMensagem('sucesso', 'Avaliação enviada!');
          this.fecharModalAvaliacao();
          this.carregarMeusAgendamentos();
        }
      });
    }
  }

  excluirAvaliacaoDoAgendamento(): void {
    if (!this.currentAvaliacaoId) return;
    if (confirm('Tem certeza que deseja apagar a sua avaliação deste serviço?')) {
      this.apiService.deletarAvaliacao(this.currentAvaliacaoId).subscribe({
        next: () => {
          this.mostrarMensagem('sucesso', 'Avaliação apagada!');
          this.fecharModalAvaliacao();
          this.carregarMeusAgendamentos();
        }
      });
    }
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDENTE': return 'status-pendente';
      case 'EM_ANDAMENTO': return 'status-andamento';
      case 'CONCLUIDO': return 'status-concluido';
      case 'CANCELADO': return 'status-cancelado';
      default: return '';
    }
  }
}
