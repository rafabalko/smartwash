import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estabelecimento {
  id: number;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  endereco: string;
  telefone: string;
  descricao: string;
  imagem?: string;
  foto?: string;
  ativo: boolean;
  is_favorito: boolean;
  limite_carros_diario?: number;
  vagas_simultaneas?: number;
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
  motivo_cancelamento?: string;
  avaliacao_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'https://smartwash-spyf.onrender.com/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private getHeadersFormData(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Token ${token}` : ''
    });
  }

  login(username: string, password: string): Observable<{ token: string; tipo: string; username: string }> {
    return this.http.post<{ token: string; tipo: string; username: string }>(
      `${this.baseUrl}/login/`,
      { username, password }
    );
  }

  cadastrar(dados: { username: string; email: string; password: string; nome?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/cadastrar/`, dados);
  }

  verificarCodigoEmail(dados: { email: string; codigo: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/verificar-email/`, dados);
  }

  solicitarResetSenha(payload: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/recuperar-senha/solicitar/`, payload);
  }

  confirmarResetSenha(payload: { email: string; codigo: string; nova_senha: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/recuperar-senha/confirmar/`, payload);
  }

  getEstabelecimentos(): Observable<Estabelecimento[]> {
    return this.http.get<Estabelecimento[]>(`${this.baseUrl}/estabelecimentos/`, { headers: this.getHeaders() });
  }

  atualizarEstabelecimentoFormData(id: number, formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/estabelecimentos/${id}/`, formData, {
      headers: this.getHeadersFormData()
    });
  }

  favoritarEstabelecimento(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/estabelecimentos/${id}/favoritar/`, {}, { headers: this.getHeaders() });
  }

  cadastrarEstabelecimento(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/cadastrar-estabelecimento/`, payload);
  }

  getAvaliacoesPorEstabelecimento(estabelecimentoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/avaliacoes/?estabelecimento=${estabelecimentoId}`, { headers: this.getHeaders() });
  }

  enviarAvaliacao(payload: { agendamento: number; estabelecimento: number; nota: number; comentario: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/avaliacoes/`, payload, { headers: this.getHeaders() });
  }

  atualizarAvaliacao(id: number, payload: { nota: number; comentario: string }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/avaliacoes/${id}/`, payload, { headers: this.getHeaders() });
  }

  deletarAvaliacao(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/avaliacoes/${id}/`, { headers: this.getHeaders() });
  }

  getServicosPorEstabelecimento(estabelecimentoId: number): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.baseUrl}/servicos/?estabelecimento=${estabelecimentoId}`, { headers: this.getHeaders() });
  }

  cadastrarServico(payload: Partial<Servico>): Observable<Servico> {
    return this.http.post<Servico>(`${this.baseUrl}/servicos/`, payload, { headers: this.getHeaders() });
  }

  atualizarServico(id: number, payload: Partial<Servico>): Observable<Servico> {
    return this.http.patch<Servico>(`${this.baseUrl}/servicos/${id}/`, payload, { headers: this.getHeaders() });
  }

  deletarServico(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/servicos/${id}/`, { headers: this.getHeaders() });
  }

  getFaturamentoDiario(data?: string): Observable<any> {
    let url = `${this.baseUrl}/agendamentos/faturamento_diario/`;
    if (data) {
      url += `?data=${data}`;
    }
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getVeiculos(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(`${this.baseUrl}/veiculos/`, { headers: this.getHeaders() });
  }

  cadastrarVeiculo(payload: Partial<Veiculo>): Observable<Veiculo> {
    return this.http.post<Veiculo>(`${this.baseUrl}/veiculos/`, payload, { headers: this.getHeaders() });
  }

  deletarVeiculo(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/veiculos/${id}/`, { headers: this.getHeaders() });
  }

  atualizarVeiculo(id: number, dados: any): Observable<Veiculo> {
    return this.http.put<Veiculo>(`${this.baseUrl}/veiculos/${id}/`, dados, { headers: this.getHeaders() });
  }

  getMeuPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.baseUrl}/perfis/me/`, { headers: this.getHeaders() });
  }

  atualizarPerfil(payload: any): Observable<Perfil> {
    return this.http.patch<Perfil>(`${this.baseUrl}/perfis/me/`, payload, { headers: this.getHeaders() });
  }

  getAgendamentos(): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamentos/`, { headers: this.getHeaders() });
  }

  criarAgendamento(payload: any): Observable<Agendamento> {
    return this.http.post<Agendamento>(`${this.baseUrl}/agendamentos/`, payload, { headers: this.getHeaders() });
  }

  atualizarStatusAgendamento(agendamentoId: number, status: string): Observable<Agendamento> {
    return this.http.patch<Agendamento>(
      `${this.baseUrl}/agendamentos/${agendamentoId}/atualizar_status/`,
      { status: status },
      { headers: this.getHeaders() }
    );
  }

  cancelarAgendamento(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/agendamentos/${id}/cancelar/`, {}, { headers: this.getHeaders() });
  }

  cancelarAgendamentoComMotivo(id: number, payload: { motivo: string }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/agendamentos/${id}/cancelar/`, payload, { headers: this.getHeaders() });
  }
}
