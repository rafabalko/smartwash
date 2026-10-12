import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Veiculo } from '../../services/api';

@Component({
  selector: 'app-meus-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meus-veiculos.html',
  styleUrl: './meus-veiculos.scss'
})
export class MeusVeiculosComponent implements OnInit {
  veiculos: Veiculo[] = [];
  carregando: boolean = true;

  marcaInput: string = '';
  modeloInput: string = '';
  placaInput: string = '';

  // Nova variável para controlar se estamos editando ou criando
  veiculoEditandoId: number | null = null;

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarVeiculos();
  }

  carregarVeiculos(): void {
    this.carregando = true;
    this.apiService.getVeiculos().subscribe({
      next: (data) => {
        this.veiculos = data;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar veículos:', err);
        this.carregando = false;
      }
    });
  }

  // Método que unifica a lógica de Cadastrar (POST) e Atualizar (PUT)
  salvarVeiculo(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    if (!this.marcaInput || !this.modeloInput || !this.placaInput) {
      this.mensagemErro = 'Por favor, preencha todos os campos do veículo.';
      return;
    }

    const payload = {
      marca: this.marcaInput,
      modelo: this.modeloInput,
      placa: this.placaInput.toUpperCase()
    };

    if (this.veiculoEditandoId) {
      // --- LÓGICA DE ATUALIZAR (EDIÇÃO) ---
      this.apiService.atualizarVeiculo(this.veiculoEditandoId, payload).subscribe({
        next: (veiculoAtualizado) => {
          // Atualiza o veículo direto na lista local para não precisar recarregar tudo do servidor
          const index = this.veiculos.findIndex(v => v.id === this.veiculoEditandoId);
          if (index !== -1) {
            this.veiculos[index] = veiculoAtualizado;
          }

          this.mensagemSucesso = 'Veículo atualizado com sucesso!';
          this.cancelarEdicao(); // Limpa o formulário
        },
        error: () => {
          this.mensagemErro = 'Erro ao atualizar veículo. Verifique os dados.';
        }
      });

    } else {
      // --- LÓGICA DE CADASTRAR (NOVO) ---
      this.apiService.cadastrarVeiculo(payload).subscribe({
        next: (novo) => {
          this.veiculos.push(novo);
          this.mensagemSucesso = 'Veículo cadastrado com sucesso!';

          // Limpa os campos
          this.marcaInput = '';
          this.modeloInput = '';
          this.placaInput = '';
        },
        error: () => {
          this.mensagemErro = 'Erro ao cadastrar veículo. Verifique os dados.';
        }
      });
    }
  }

  // Joga os dados do card para o formulário
  prepararEdicao(veiculo: Veiculo): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    this.veiculoEditandoId = veiculo.id;
    this.marcaInput = veiculo.marca;
    this.modeloInput = veiculo.modelo;
    this.placaInput = veiculo.placa;

    // Rola a tela suavemente para cima para o usuário ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Aborta a edição e limpa os campos
  cancelarEdicao(): void {
    this.veiculoEditandoId = null;
    this.marcaInput = '';
    this.modeloInput = '';
    this.placaInput = '';
    this.mensagemErro = '';
  }

  deletarVeiculo(id: number): void {
    if (confirm('Deseja realmente remover este veículo?')) {
      this.apiService.deletarVeiculo(id).subscribe({
        next: () => {
          this.veiculos = this.veiculos.filter(v => v.id !== id);
          this.mensagemSucesso = 'Veículo removido com sucesso!';
        },
        error: () => {
          this.mensagemErro = 'Erro ao remover veículo.';
        }
      });
    }
  }
}
