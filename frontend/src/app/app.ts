import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from './components/navbar/navbar';
import { BuscaEstabelecimentosComponent } from './components/busca-estabelecimentos/busca-estabelecimentos';
import { DetalhesEstabelecimentoComponent } from './components/detalhes-estabelecimento/detalhes-estabelecimento';
import { AgendamentoComponent } from './components/agendamento/agendamento';
import { HistoricoComponent } from './components/historico/historico';
import { MeusVeiculosComponent } from './components/meus-veiculos/meus-veiculos';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin';
import { ClientesAdminComponent } from './components/clientes-admin/clientes-admin'; // <--- ADICIONADO AQUI
import { GestaoServicosComponent } from './components/gestao-servicos/gestao-servicos';
import { MinhaEmpresaComponent } from './components/minha-empresa/minha-empresa.component';
import { MeuPerfilComponent } from './components/meu-perfil/meu-perfil';
import { FavoritosComponent } from './components/favoritos/favoritos';
import { AuthComponent } from './components/auth/auth';
import { Estabelecimento } from './services/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    BuscaEstabelecimentosComponent,
    DetalhesEstabelecimentoComponent,
    AgendamentoComponent,
    HistoricoComponent,
    MeusVeiculosComponent,
    DashboardAdminComponent,
    ClientesAdminComponent, // <--- ADICIONADO AQUI NOS IMPORTS DO ANGULAR
    GestaoServicosComponent,
    MinhaEmpresaComponent,
    MeuPerfilComponent,
    FavoritosComponent,
    AuthComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isLoggedIn: boolean = false;
  userTipo: string = 'CLIENTE';
  abaAtiva: string = 'login';
  estabelecimentoSelecionado: Estabelecimento | null = null;

  ngOnInit(): void {
    this.verificarAutenticacao();
  }

  verificarAutenticacao(): void {
    const token = localStorage.getItem('auth_token');
    const tipo = localStorage.getItem('user_tipo');

    this.isLoggedIn = !!token;
    this.userTipo = tipo ? tipo.toUpperCase() : 'CLIENTE';

    if (this.isLoggedIn) {
      this.abaAtiva = this.userTipo === 'ADMIN' ? 'dashboard' : 'buscar';
    } else {
      this.abaAtiva = 'login';
    }
  }

  mudarAba(novaAba: string): void {
    if (!this.isLoggedIn) {
      this.abaAtiva = 'login';
      return;
    }
    this.abaAtiva = novaAba;
  }

  onEstabelecimentoSelecionado(estabelecimento: Estabelecimento): void {
    this.estabelecimentoSelecionado = estabelecimento;
    this.abaAtiva = 'detalhes-estabelecimento';
  }

  irParaFormularioAgendamento(): void {
    this.abaAtiva = 'novo-agendamento';
  }

  voltarParaBusca(): void {
    this.abaAtiva = 'buscar';
  }

  executarLogout(): void {
    localStorage.clear();
    this.isLoggedIn = false;
    this.userTipo = 'CLIENTE';
    this.estabelecimentoSelecionado = null;
    this.abaAtiva = 'login';
    window.location.reload();
  }
}
