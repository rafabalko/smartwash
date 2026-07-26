import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Servico } from '../../services/api';

@Component({
  selector: 'app-gestao-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestao-servicos.html',
  styleUrl: './gestao-servicos.scss'
})
export class GestaoServicosComponent implements OnInit {
  servicos: Servico[] = [];
  carregando: boolean = true;

  // Campos do formulário
  idEdicao: number | null = null;
  nomeInput: string = '';
  descricaoInput: string = '';
  precoInput: string = '';
  duracaoInput: number = 30;

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarServicos();
  }

  carregarServicos(): void {
    this.carregando = true;
    this.apiService.getServicosPorEstabelecimento(1).subscribe({ // Ajuste dinâmico se necessário
      next: (data) => {
        this.servicos = data;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar serviços:', err);
        this.carregando = false;
      }
    });
  }

  salvarServico(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    if (!this.nomeInput || !this.precoInput || !this.duracaoInput) {
      this.mensagemErro = 'Por favor, preencha nome, preço e duração.';
      return;
    }

    const payload: Partial<Servico> = {
      nome: this.nomeInput,
      descricao: this.descricaoInput,
      preco: this.precoInput,
      duracao_em_minutos: this.duracaoInput,
      ativo: true
    };

    if (this.idEdicao) {
      // Atualizar existente
      this.apiService.atualizarServico(this.idEdicao, payload).subscribe({
        next: (atualizado) => {
          const index = this.servicos.findIndex(s => s.id === this.idEdicao);
          if (index !== -1) this.servicos[index] = atualizado;
          this.mensagemSucesso = 'Serviço atualizado com sucesso!';
          this.limparFormulario();
        },
        error: () => this.mensagemErro = 'Erro ao atualizar serviço.'
      });
    } else {
      // Cadastrar novo
      this.apiService.cadastrarServico(payload).subscribe({
        next: (novo) => {
          this.servicos.push(novo);
          this.mensagemSucesso = 'Serviço cadastrado com sucesso!';
          this.limparFormulario();
        },
        error: () => this.mensagemErro = 'Erro ao cadastrar serviço.'
      });
    }
  }

  editarServico(s: Servico): void {
    this.idEdicao = s.id;
    this.nomeInput = s.nome;
    this.descricaoInput = s.descricao;
    this.precoInput = s.preco;
    this.duracaoInput = s.duracao_em_minutos;
  }

  excluirServico(id: number): void {
    if (confirm('Deseja realmente excluir este serviço do catálogo?')) {
      this.apiService.deletarServico(id).subscribe({
        next: () => {
          this.servicos = this.servicos.filter(s => s.id !== id);
          this.mensagemSucesso = 'Serviço removido com sucesso!';
        },
        error: () => this.mensagemErro = 'Erro ao remover serviço.'
      });
    }
  }

  limparFormulario(): void {
    this.idEdicao = null;
    this.nomeInput = '';
    this.descricaoInput = '';
    this.precoInput = '';
    this.duracaoInput = 30;
  }
}
