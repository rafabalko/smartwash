import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Agendamento } from '../../services/api';

export interface ClienteResumo {
  nome: string;
  telefone: string;
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
      next: (res: any) => {
        const agendamentos: Agendamento[] = res.results ? res.results : res;
        this.processarClientes(agendamentos);
        this.carregando = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar clientes:', err);
        this.carregando = false;
      }
    });
  }

  processarClientes(agendamentos: Agendamento[]): void {
    const mapa = new Map<string, ClienteResumo>();

    agendamentos.forEach(a => {
      if (a.status === 'CANCELADO') return;

      const nomeCliente = (a as any).cliente_nome || 'Cliente Não Identificado';
      const telefoneCliente = (a as any).cliente_telefone || (a as any).cliente?.perfil?.telefone || '';

      const chaveUnica = `${nomeCliente}-${a.veiculo_placa}`;

      if (!mapa.has(chaveUnica)) {
        mapa.set(chaveUnica, {
          nome: nomeCliente,
          telefone: telefoneCliente,
          veiculo: a.veiculo_modelo || 'N/A',
          placa: a.veiculo_placa || 'N/A',
          totalAgendamentos: 1,
          ultimoAgendamento: a.data_hora_inicio
        });
      } else {
        const clienteExistente = mapa.get(chaveUnica)!;
        clienteExistente.totalAgendamentos += 1;

        if (!clienteExistente.telefone && telefoneCliente) {
          clienteExistente.telefone = telefoneCliente;
        }

        if (new Date(a.data_hora_inicio) > new Date(clienteExistente.ultimoAgendamento)) {
          clienteExistente.ultimoAgendamento = a.data_hora_inicio;
        }
      }
    });

    this.clientes = Array.from(mapa.values()).sort((a, b) => {
      return new Date(b.ultimoAgendamento).getTime() - new Date(a.ultimoAgendamento).getTime();
    });
  }

  get clientesFiltrados(): ClienteResumo[] {
    if (!this.termoBusca.trim()) {
      return this.clientes;
    }
    const termo = this.termoBusca.toLowerCase();
    return this.clientes.filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      c.placa.toLowerCase().includes(termo) ||
      c.veiculo.toLowerCase().includes(termo) ||
      c.telefone.toLowerCase().includes(termo)
    );
  }
}
