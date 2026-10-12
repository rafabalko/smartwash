import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Servico, Veiculo, Estabelecimento } from '../../services/api';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.scss'
})
export class AgendamentoComponent implements OnInit, OnChanges {
  @Input() estabelecimento: Estabelecimento | null = null;
  @Output() mudarAba = new EventEmitter<string>();

  servicos: Servico[] = [];
  veiculos: Veiculo[] = [];

  servicoSelecionadoId: number | null = null;
  veiculoSelecionadoId: number | null = null;
  telefoneCliente: string = '';

  // Controle de Data e Horários Disponíveis
  dataSelecionada: string = '';
  horaSelecionada: string = '';

  horariosPossiveis: string[] = [
    '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];
  horariosOcupados: string[] = [];

  mensagemSucesso: string = '';
  mensagemErro: string = '';
  timeoutMensagem: any;
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarPerfilCliente();

    // Carrega os veículos do cliente para o Dropdown
    this.apiService.getVeiculos().subscribe({
      next: (data) => (this.veiculos = data),
      error: (err) => console.error(err)
    });

    if (this.estabelecimento) {
      this.carregarServicosDoEstabelecimento();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
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
      error: (err) => console.error('Erro ao carregar perfil do cliente', err)
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

  carregarServicosDoEstabelecimento(): void {
    if (!this.estabelecimento) return;
    this.apiService.getServicosPorEstabelecimento(this.estabelecimento.id).subscribe({
      next: (data) => (this.servicos = data),
      error: (err) => console.error(err)
    });
  }

  onDataChange(): void {
    this.horaSelecionada = '';
    this.horariosOcupados = [];

    if (!this.dataSelecionada || !this.estabelecimento) return;

    this.apiService.getHorariosOcupados(this.estabelecimento.id, this.dataSelecionada).subscribe({
      next: (ocupados: any[]) => {
        // Pega apenas os 5 primeiros caracteres (HH:MM) para bater com '08:00', '09:00', etc.
        this.horariosOcupados = ocupados.map(o => {
          const horaInicio = o.inicio ? o.inicio.toString() : '';
          return horaInicio.substring(0, 5);
        });
        console.log("Horários ocupados formatados:", this.horariosOcupados);
      },
      error: (err) => {
        console.error('Erro ao buscar horários ocupados:', err);
      }
    });
  }

  isHorarioOcupado(hora: string): boolean {
    return this.horariosOcupados.includes(hora);
  }

  selecionarHora(hora: string): void {
    if (this.isHorarioOcupado(hora)) return;
    this.horaSelecionada = hora;
  }

  realizarAgendamento(): void {
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
      error: (err) => {
        this.carregando = false;
        const msgErro = err.error?.data_hora_inicio?.[0] || 'Erro ao realizar agendamento. Tente outro horário.';
        this.mostrarMensagem('erro', msgErro);
      }
    });
  }
}
