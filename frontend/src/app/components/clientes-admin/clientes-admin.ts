import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Agendamento } from '../../services/api';

export interface ClienteResumo {
  nome: string;
  veiculo: string;
  placa: string;
  totalAgendamentos: number;
  ultimoAgendamento: string;
}

@Component({
  selector: 'app-clientes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes-admin.html',
  styleUrl: './clientes-admin.scss'
})
export class ClientesAdminComponent implements OnInit {
  clientes: ClienteResumo[] = [];
  termoBusca: string = '';
  carregando: boolean = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.carregando = true;
    this.apiService.getAgendamentos().subscribe({
      next: (agendamentos: Agendamento[]) => {
        this.processarClientes(agendamentos);
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar clientes:', err);
        this.carregando = false;
      }
    });
  }

  processarClientes(agendamentos: Agendamento[]): void {
    const mapa = new Map<string, ClienteResumo>();

    agendamentos.forEach(a => {
      const nomeCliente = a.cliente_nome || 'Cliente Não Identificado';

      if (!mapa.has(nomeCliente)) {
        mapa.set(nomeCliente, {
          nome: nomeCliente,
          veiculo: a.veiculo_modelo || 'N/A',
          placa: a.veiculo_placa || 'N/A',
          totalAgendamentos: 1,
          ultimoAgendamento: a.data_hora_inicio
        });
      } else {
        const clienteExistente = mapa.get(nomeCliente)!;
        clienteExistente.totalAgendamentos += 1;
        if (new Date(a.data_hora_inicio) > new Date(clienteExistente.ultimoAgendamento)) {
          clienteExistente.ultimoAgendamento = a.data_hora_inicio;
        }
      }
    });

    this.clientes = Array.from(mapa.values());
  }

  get clientesFiltrados(): ClienteResumo[] {
    if (!this.termoBusca.trim()) {
      return this.clientes;
    }
    const termo = this.termoBusca.toLowerCase();
    return this.clientes.filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      c.placa.toLowerCase().includes(termo) ||
      c.veiculo.toLowerCase().includes(termo)
    );
  }
}
