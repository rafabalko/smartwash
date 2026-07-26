import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Agendamento } from '../../services/api';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss'
})
export class DashboardAdminComponent implements OnInit {
  agendamentos: Agendamento[] = [];
  carregando: boolean = true;
  mensagemSucesso: string = '';

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
