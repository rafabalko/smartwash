import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Perfil } from '../../services/api';

@Component({
  selector: 'app-meu-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meu-perfil.html',
  styleUrl: './meu-perfil.scss'
})
export class MeuPerfilComponent implements OnInit {
  perfil: Perfil | null = null;
  carregando: boolean = true;

  // Campos de Dados Pessoais
  telefoneInput: string = '';
  dataNascimentoInput: string = '';
  generoInput: string = 'N';

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarPerfil();
  }

  carregarPerfil(): void {
    this.carregando = true;
    this.apiService.getMeuPerfil().subscribe({
      next: (data) => {
        this.perfil = data;
        this.telefoneInput = data.telefone || '';
        this.dataNascimentoInput = data.data_nascimento || '';
        this.generoInput = data.genero || 'N';
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar perfil:', err);
        this.carregando = false;
      }
    });
  }

  salvarPerfil(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    const payload = {
      telefone: this.telefoneInput,
      data_nascimento: this.dataNascimentoInput || null,
      genero: this.generoInput
    };

    this.apiService.atualizarPerfil(payload).subscribe({
      next: (atualizado) => {
        this.perfil = atualizado;
        this.mensagemSucesso = 'Perfil atualizado com sucesso!';
      },
      error: () => {
        this.mensagemErro = 'Erro ao atualizar dados do perfil.';
      }
    });
  }
}
