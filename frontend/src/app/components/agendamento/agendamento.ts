import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Servico, Veiculo } from '../../services/api';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.scss'
})
export class AgendamentoComponent implements OnInit {
  isLoggedIn: boolean = false;
  usernameInput: string = '';
  passwordInput: string = '';

  servicos: Servico[] = [];
  veiculos: Veiculo[] = [];
  servicoSelecionadoId: number | null = null;
  veiculoSelecionadoId: number | null = null;
  dataHoraInicio: string = '';

  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.isLoggedIn = true;
      this.carregarDados();
    }
  }

  fazerLogin(): void {
    this.mensagemErro = '';
    this.apiService.login(this.usernameInput, this.passwordInput).subscribe({
      next: (res: { token: string }) => {
        localStorage.setItem('auth_token', res.token);
        this.isLoggedIn = true;
        this.carregarDados();
      },
      error: () => {
        this.mensagemErro = 'Usuário ou senha inválidos.';
      }
    });
  }

  fazerLogout(): void {
    localStorage.removeItem('auth_token');
    this.isLoggedIn = false;
  }

  carregarDados(): void {
    // Busca os serviços do estabelecimento (passando 1 como id padrão ou filtro geral)
    this.apiService.getServicosPorEstabelecimento(1).subscribe({
      next: (data: Servico[]) => (this.servicos = data),
      error: (err: any) => console.error('Erro ao buscar serviços', err)
    });

    this.apiService.getVeiculos().subscribe({
      next: (data: Veiculo[]) => (this.veiculos = data),
      error: (err: any) => console.error('Erro ao buscar veículos', err)
    });
  }

  realizarAgendamento(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    if (!this.servicoSelecionadoId || !this.veiculoSelecionadoId || !this.dataHoraInicio) {
      this.mensagemErro = 'Por favor, preencha todos os campos.';
      return;
    }

    this.carregando = true;

    const payload = {
      servico: this.servicoSelecionadoId,
      veiculo: this.veiculoSelecionadoId,
      data_hora_inicio: this.dataHoraInicio
    };

    this.apiService.criarAgendamento(payload).subscribe({
      next: () => {
        this.carregando = false;
        this.mensagemSucesso = 'Agendamento realizado com sucesso!';
        this.servicoSelecionadoId = null;
        this.dataHoraInicio = '';
      },
      error: () => {
        this.carregando = false;
        this.mensagemErro = 'Erro ao realizar agendamento.';
      }
    });
  }
}
