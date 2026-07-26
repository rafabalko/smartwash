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

  statusOpcoes = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
    { label: 'Concluído', value: 'CONCLUIDO' },
    { label: 'Cancelado', value: 'CANCELADO' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarAgendamentos();
  }

  carregarAgendamentos(): void {
    this.carregando = true;
    this.apiService.getAgendamentos().subscribe({
      next: (data) => {
        this.agendamentos = data;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar agendamentos do painel:', err);
        this.carregando = false;
      }
    });
  }

  alterarStatus(agendamento: Agendamento, novoStatus: string): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    this.apiService.atualizarStatusAgendamento(agendamento.id, novoStatus).subscribe({
      next: (atualizado) => {
        agendamento.status = atualizado.status;
        this.mensagemSucesso = `Status do agendamento #${agendamento.id} alterado para ${novoStatus} com sucesso!`;
      },
      error: (err) => {
        console.error('Erro ao alterar status:', err);
        this.mensagemErro = 'Não foi possível atualizar o status do agendamento.';
      }
    });
  }

  get totalPendentes(): number {
    return this.agendamentos.filter(a => a.status === 'PENDENTE').length;
  }

  get totalEmAndamento(): number {
    return this.agendamentos.filter(a => a.status === 'EM_ANDAMENTO').length;
  }

  get totalConcluidos(): number {
    return this.agendamentos.filter(a => a.status === 'CONCLUIDO').length;
  }
}
