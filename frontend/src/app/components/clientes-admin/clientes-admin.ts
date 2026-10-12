import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Agendamento } from '../../services/api';

export interface ClienteResumo {
  nome: string;
  telefone: string; // 📱 Novo campo de telefone adicionado
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
      // Ignora agendamentos cancelados no histórico de visitas, se preferir
      if (a.status === 'CANCELADO') return;

      const nomeCliente = (a as any).cliente_nome || 'Cliente Não Identificado';

      // 📱 Pega o telefone do cliente enviado pelo backend
      const telefoneCliente = (a as any).cliente_telefone || (a as any).cliente?.perfil?.telefone || '';

      // Agrupamos pela placa do veículo para garantir que homônimos não se misturem
      const chaveUnica = `${nomeCliente}-${a.veiculo_placa}`;

      if (!mapa.has(chaveUnica)) {
        mapa.set(chaveUnica, {
          nome: nomeCliente,
          telefone: telefoneCliente, // 👈 Registra o telefone
          veiculo: a.veiculo_modelo || 'N/A',
          placa: a.veiculo_placa || 'N/A',
          totalAgendamentos: 1,
          ultimoAgendamento: a.data_hora_inicio
        });
      } else {
        const clienteExistente = mapa.get(chaveUnica)!;
        clienteExistente.totalAgendamentos += 1;

        // Atualiza o telefone caso esteja vazio e venha preenchido em agendamento posterior
        if (!clienteExistente.telefone && telefoneCliente) {
          clienteExistente.telefone = telefoneCliente;
        }

        // Atualiza a data da última visita se esse agendamento for mais recente
        if (new Date(a.data_hora_inicio) > new Date(clienteExistente.ultimoAgendamento)) {
          clienteExistente.ultimoAgendamento = a.data_hora_inicio;
        }
      }
    });

    // 🚀 Transforma o Mapa em Array e ORDENA da visita mais recente para a mais antiga
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
      c.telefone.toLowerCase().includes(termo) // 🔍 Permite buscar também pelo telefone se desejar!
    );
  }
}
