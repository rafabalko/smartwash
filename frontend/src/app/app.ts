import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { BuscaEstabelecimentosComponent } from './components/busca-estabelecimentos/busca-estabelecimentos';
import { AgendamentoComponent } from './components/agendamento/agendamento';
import { MeusVeiculosComponent } from './components/meus-veiculos/meus-veiculos';
import { Estabelecimento } from './services/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    BuscaEstabelecimentosComponent,
    AgendamentoComponent.
    MeusVeiculosComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isLoggedIn: boolean = false;
  abaAtiva: string = 'buscar'; // 'buscar' | 'agendamentos' | 'historico' | 'favoritos' | 'veiculos' | 'perfil' | 'alterar-senha'
  estabelecimentoSelecionado: Estabelecimento | null = null;

  ngOnInit(): void {
    this.verificarAutenticacao();
  }

  verificarAutenticacao(): void {
    const token = localStorage.getItem('auth_token');
    this.isLoggedIn = !!token;
  }

  mudarAba(novaAba: string): void {
    this.abaAtiva = novaAba;
  }

  onEstabelecimentoSelecionado(estabelecimento: Estabelecimento): void {
    this.estabelecimentoSelecionado = estabelecimento;
    this.abaAtiva = 'agendamentos';
  }

  executarLogout(): void {
    localStorage.removeItem('auth_token');
    this.isLoggedIn = false;
    this.abaAtiva = 'buscar';
  }
}
