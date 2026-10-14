import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Servico, Veiculo, Estabelecimento, Agendamento } from '../../services/api';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.scss'
})
export class AgendamentoComponent implements OnInit, OnChanges {
  @Input() estabelecimento: Estabelecimento | null = null;
  @Input() modoLista: boolean = false;
  @Output() mudarAba = new EventEmitter<string>();

  meusAgendamentos: Agendamento[] = [];
  servicos: Servico[] = [];
  veiculos: Veiculo[] = [];

  servicoSelecionadoId: number | null = null;
  veiculoSelecionadoId: number | null = null;
  telefoneCliente: string = '';

  dataSelecionada: string = '';
  horaSelecionada: string = '';

  horariosPossiveis: string[] = [
    '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  horariosOcupadosMap: { [hora: string]: number } = {};
  diaTotalmenteLotado: boolean = false;

  mensagemSucesso: string = '';
  mensagemErro: string = '';
  timeoutMensagem: any;
  carregando: boolean = false;

  exibirModalCancelamento: boolean = false;
  agendamentoParaCancelar: any = null;
  motivoCancelamentoText: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarDados();
    this.carregarPerfilCliente();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modoLista'] && this.modoLista) {
      this.carregarMeusAgendamentos();
    }
    if (changes['estabelecimento'] && this.estabelecimento) {
      this.carregarServicosDoEstabelecimento();
    }
  }

  carregarPerfilCliente(): void {
    this.apiService.getMeuPerfil().subscribe({
      next: (perfil: any) => {
        if (perfil && perfil.telefone) {
          this.telefoneCliente = perfil.telefone;
        }
      },
      error: (err: any) => console.error('Erro ao carregar perfil do cliente', err)
    });
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

  carregarDados(): void {
    if (this.modoLista) {
      this.carregarMeusAgendamentos();
    } else {
      if (this.estabelecimento) {
        this.carregarServicosDoEstabelecimento();
      }
      this.apiService.getVeiculos().subscribe({
        next: (data: any) => {
          this.veiculos = data.results ? data.results : data;
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  carregarMeusAgendamentos(): void {
    this.apiService.getAgendamentos().subscribe({
      next: (data: any) => {
        this.meusAgendamentos = data.results ? data.results : data;
      },
      error: (err: any) => console.error(err)
    });
  }

  carregarServicosDoEstabelecimento(): void {
    if (!this.estabelecimento) return;
    this.apiService.getServicosPorEstabelecimento(this.estabelecimento.id).subscribe({
      next: (data: any) => {
        this.servicos = data.results ? data.results : data;
      },
      error: (err: any) => console.error(err)
    });
  }

  onDataChange(): void {
    this.horaSelecionada = '';
    this.diaTotalmenteLotado = false;
    this.horariosOcupadosMap = {};

    if (!this.dataSelecionada || !this.estabelecimento) return;

    this.apiService.getAgendamentos().subscribe({
      next: (res: any) => {
        const agendamentos = res.results ? res.results : res;

        const agendamentosDoDia = agendamentos.filter((a: any) => {
          if (a.estabelecimento !== this.estabelecimento?.id || a.status === 'CANCELADO') return false;
          const dataAgendada = a.data_hora_inicio.split('T')[0];
          return dataAgendada === this.dataSelecionada;
        });

        const limiteDiario = (this.estabelecimento as any).limite_carros_diario || 3;
        if (agendamentosDoDia.length >= limiteDiario) {
          this.diaTotalmenteLotado = true;
          this.mostrarMensagem('erro', `O lava-rápido atingiu o limite máximo de ${limiteDiario} atendimentos para esta data. Escolha outro dia.`);
          return;
        }

        agendamentosDoDia.forEach((a: any) => {
          const horaFull = a.data_hora_inicio.split('T')[1];
          const hora = horaFull ? horaFull.substring(0, 5) : '';
          if (hora) {
            this.horariosOcupadosMap[hora] = (this.horariosOcupadosMap[hora] || 0) + 1;
          }
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  isHorarioOcupado(hora: string): boolean {
    if (this.diaTotalmenteLotado) return true;

    const vagasSimultaneas = (this.estabelecimento as any).vagas_simultaneas || 1;
    const agendadosNoHorario = this.horariosOcupadosMap[hora] || 0;

    return agendadosNoHorario >= vagasSimultaneas;
  }

  selecionarHora(hora: string): void {
    if (this.isHorarioOcupado(hora)) return;
    this.horaSelecionada = hora;
  }

  realizarAgendamento(): void {
    if (this.diaTotalmenteLotado) {
      this.mostrarMensagem('erro', 'A data selecionada já atingiu o limite de agendamentos diários.');
      return;
    }

    if (!this.servicoSelecionadoId || !this.veiculoSelecionadoId || !this.dataSelecionada || !this.horaSelecionada) {
      this.mostrarMensagem('erro', 'Por favor, selecione o serviço, o veículo, a data e um horário disponível.');
      return;
    }

    this.carregando = true;
    const dataHoraIso = `${this.dataSelecionada}T${this.horaSelecionada}:00`;

    const payload = {
      estabelecimento: this.estabelecimento?.id,
      servico: this.servicoSelecionadoId,
      veiculo: this.veiculoSelecionadoId,
      data_hora_inicio: dataHoraIso,
      telefone: this.telefoneCliente
    };

    this.apiService.criarAgendamento(payload).subscribe({
      next: () => {
        this.carregando = false;
        this.mostrarMensagem('sucesso', 'Agendamento realizado com sucesso!');

        setTimeout(() => {
          this.mudarAba.emit('agendamentos');
        }, 1000);

        this.servicoSelecionadoId = null;
        this.horaSelecionada = '';
        this.onDataChange();
      },
      error: (err: any) => {
        this.carregando = false;
        const msgErro = err.error?.data_hora_inicio
          ? (Array.isArray(err.error.data_hora_inicio) ? err.error.data_hora_inicio[0] : err.error.data_hora_inicio)
          : (err.error?.erro || 'Erro ao realizar agendamento. Tente outro horário.');

        this.mostrarMensagem('erro', msgErro);
      }
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
    this.motivoCancelamentoText = '';
  }

  confirmarCancelamento(): void {
    if (!this.agendamentoParaCancelar) return;

    const payload = { motivo: this.motivoCancelamentoText };

    this.apiService.cancelarAgendamentoComMotivo(this.agendamentoParaCancelar.id, payload).subscribe({
      next: () => {
        this.mostrarMensagem('sucesso', 'Seu agendamento foi cancelado com sucesso.');
        this.exibirModalCancelamento = false;
        this.agendamentoParaCancelar = null;
        this.motivoCancelamentoText = '';
        this.carregarMeusAgendamentos();
      },
      error: (err: any) => {
        console.error('Erro ao cancelar:', err);
        this.mostrarMensagem('erro', err.error?.error || 'Não foi possível cancelar o agendamento.');
        this.exibirModalCancelamento = false;
      }
    });
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
