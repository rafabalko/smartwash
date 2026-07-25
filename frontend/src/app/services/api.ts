import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estabelecimento {
  id: number;
  nome_fantasia: string;
  endereco: string;
  telefone: string;
  descricao: string;
  foto: string | null;
  ativo: boolean;
  is_favorito: boolean;
}

export interface Servico {
  id: number;
  estabelecimento: number;
  nome: string;
  descricao: string;
  preco: string;
  duracao_em_minutos: number;
  ativo: boolean;
}

export interface Veiculo {
  id: number;
  modelo: string;
  marca: string;
  placa: string;
}

export interface Perfil {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  tipo: string;
  telefone: string;
  data_nascimento: string;
  genero: string;
  foto_perfil: string | null;
}

export interface Agendamento {
  id: number;
  estabelecimento: number;
  estabelecimento_nome: string;
  veiculo: number;
  veiculo_modelo: string;
  veiculo_placa: string;
  servico: number;
  servico_nome: string;
  cliente_nome: string;
  data_hora_inicio: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/login/`, { username, password });
  }

  // Estabelecimentos
  getEstabelecimentos(): Observable<Estabelecimento[]> {
    return this.http.get<Estabelecimento[]>(`${this.baseUrl}/estabelecimentos/`);
  }

  toggleFavorito(estabelecimentoId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/estabelecimentos/${estabelecimentoId}/favoritar/`, {});
  }

  // Serviços por Estabelecimento
  getServicosPorEstabelecimento(estabelecimentoId: number): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.baseUrl}/servicos/?estabelecimento=${estabelecimentoId}`);
  }

  // Veículos
  getVeiculos(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(`${this.baseUrl}/veiculos/`);
  }

  cadastrarVeiculo(payload: Partial<Veiculo>): Observable<Veiculo> {
    return this.http.post<Veiculo>(`${this.baseUrl}/veiculos/`, payload);
  }

  deletarVeiculo(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/veiculos/${id}/`);
  }

  // Perfil
  getMeuPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.baseUrl}/perfil/me/`);
  }

  atualizarPerfil(payload: any): Observable<Perfil> {
    return this.http.patch<Perfil>(`${this.baseUrl}/perfil/me/`, payload);
  }

  // Agendamentos
  getAgendamentos(): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamentos/`);
  }

  criarAgendamento(payload: any): Observable<Agendamento> {
    return this.http.post<Agendamento>(`${this.baseUrl}/agendamentos/`, payload);
  }
}
