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

  idEstabelecimentoAtual: number = 0;

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

    this.apiService.getMeuPerfil().subscribe({
      next: (perfil: any) => {
        const idEstabelecimento = perfil.estabelecimento_id || perfil.estabelecimento;

        if (!idEstabelecimento) {
          this.mensagemErro = 'Nenhum estabelecimento vinculado a este usuário.';
          this.carregando = false;
          return;
        }

        this.idEstabelecimentoAtual = Number(idEstabelecimento);

        this.apiService.getServicosPorEstabelecimento(this.idEstabelecimentoAtual).subscribe({
          next: (res: any) => {
            // Blindagem para tratar listas simples ou paginadas do Django
            this.servicos = res.results ? res.results : res;
            this.carregando = false;
          },
          error: (err: any) => {
            console.error('Erro ao carregar serviços:', err);
            this.carregando = false;
          }
        });
      },
      error: (err: any) => {
        console.error('Erro ao carregar perfil:', err);
        this.mensagemErro = 'Erro ao identificar a empresa do usuário.';
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

    if (!this.idEstabelecimentoAtual) {
      this.mensagemErro = 'ID do estabelecimento não carregado.';
      return;
    }

    const payload: any = {
      nome: this.nomeInput,
      descricao: this.descricaoInput,
      preco: this.precoInput,
      duracao_em_minutos: this.duracaoInput,
      ativo: true,
      estabelecimento: this.idEstabelecimentoAtual
    };

    if (this.idEdicao) {
      this.apiService.atualizarServico(this.idEdicao, payload).subscribe({
        next: () => {
          this.mensagemSucesso = 'Serviço atualizado com sucesso!';
          this.limparFormulario();
          this.carregarServicos();
        },
        error: (err: any) => {
          console.error('Erro ao atualizar serviço:', err);
          this.mensagemErro = 'Erro ao atualizar serviço.';
        }
      });
    } else {
      this.apiService.cadastrarServico(payload).subscribe({
        next: () => {
          this.mensagemSucesso = 'Serviço cadastrado com sucesso!';
          this.limparFormulario();
          this.carregarServicos();
        },
        error: (err: any) => {
          console.error('Erro ao cadastrar serviço:', err);
          this.mensagemErro = 'Erro ao cadastrar serviço.';
        }
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
        error: (err: any) => {
          console.error('Erro ao deletar serviço:', err);
          this.mensagemErro = 'Erro ao remover serviço.';
        }
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
