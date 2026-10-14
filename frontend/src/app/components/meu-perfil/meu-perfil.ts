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
  perfil: Perfil = {
    id: 0,
    user: {
      id: 0,
      username: '',
      email: '',
      first_name: '',
      last_name: ''
    },
    tipo: 'CLIENTE',
    telefone: '',
    data_nascimento: '',
    genero: '',
    foto_perfil: null
  };

  carregando: boolean = true;
  salvando: boolean = false;
  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarPerfil();
  }

  carregarPerfil(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.apiService.getMeuPerfil().subscribe({
      next: (res: any) => {
        const dados = Array.isArray(res) ? res[0] : res;

        if (dados) {
          this.perfil = {
            id: dados.id || 0,
            user: {
              id: dados.user?.id || 0,
              username: dados.user?.username || dados.username || '',
              email: dados.user?.email || dados.email || '',
              first_name: dados.user?.first_name || dados.first_name || '',
              last_name: dados.user?.last_name || dados.last_name || ''
            },
            tipo: dados.tipo || 'CLIENTE',
            telefone: dados.telefone || '',
            data_nascimento: dados.data_nascimento || '',
            genero: dados.genero || '',
            foto_perfil: null
          };
        }
        this.carregando = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar perfil:', err);
        this.carregando = false;
        this.mensagemErro = 'Não foi possível carregar os dados do perfil.';
      }
    });
  }

  aplicarMascaraTelefone(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');

    valor = valor.substring(0, 11);

    if (valor.length === 0) {
      valor = '';
    } else if (valor.length <= 2) {
      valor = valor.replace(/^(\d{0,2})/, '($1');
    } else if (valor.length <= 6) {
      valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (valor.length <= 10) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }

    this.perfil.telefone = valor;
    event.target.value = valor;
  }

  salvarPerfil(): void {
    this.salvando = true;
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    const payload = {
      user: {
        first_name: this.perfil.user.first_name,
        last_name: this.perfil.user.last_name,
        email: this.perfil.user.email
      },
      first_name: this.perfil.user.first_name,
      last_name: this.perfil.user.last_name,
      email: this.perfil.user.email,
      telefone: this.perfil.telefone,
      data_nascimento: this.perfil.data_nascimento,
      genero: this.perfil.genero
    };

    this.apiService.atualizarPerfil(payload).subscribe({
      next: (res: any) => {
        this.salvando = false;
        this.mensagemSucesso = 'Perfil atualizado com sucesso!';
      },
      error: (err: any) => {
        console.error('Erro ao salvar perfil:', err);
        this.salvando = false;
        this.mensagemErro = err.error?.detail || err.error?.error || 'Erro ao salvar as alterações do perfil.';
      }
    });
  }
}
