import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Servico {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  duracao_em_minutos: number;
}

export interface Veiculo {
  id: number;
  modelo: string;
  marca: string;
  placa: string;
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

  getServicos(): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.baseUrl}/servicos/`);
  }

  getVeiculos(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(`${this.baseUrl}/veiculos/`);
  }

  criarAgendamento(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/agendamentos/`, payload);
  }
}
