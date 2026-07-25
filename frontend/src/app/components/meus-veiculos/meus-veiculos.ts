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

  cadastrarVeiculo(): void {
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

    this.apiService.cadastrarVeiculo(payload).subscribe({
      next: (novo) => {
        this.veiculos.push(novo);
        this.mensagemSucesso = 'Veículo cadastrado com sucesso!';
        this.marcaInput = '';
        this.modeloInput = '';
        this.placaInput = '';
      },
      error: () => {
        this.mensagemErro = 'Erro ao cadastrar veículo. Verifique os dados.';
      }
    });
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
