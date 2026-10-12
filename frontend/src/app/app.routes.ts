import { Routes } from '@angular/router';

// 1. Importação dos componentes do sistema
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin';
import { ClientesAdminComponent } from './components/clientes-admin/clientes-admin';
import { AgendamentoComponent } from './components/agendamento/agendamento';

export const routes: Routes = [
  // Redireciona a rota inicial (http://localhost:4200/) direto para o Dashboard Admin
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Painel de Controle do Administrador (Dashboard com o mini calendário e métricas)
  { path: 'dashboard', component: DashboardAdminComponent },

  // CRM - Base de Clientes do Lava-Rápido (Histórico, filtro e contagem de lavagens)
  { path: 'clientes', component: ClientesAdminComponent },

  // Tela de Agendamento do Cliente (Meus Agendamentos e Novo Agendamento)
  { path: 'agendamentos', component: AgendamentoComponent },

  // Rota curinga: Redireciona para o dashboard caso o usuário digite uma URL que não existe
  { path: '**', redirectTo: 'dashboard' }
];
