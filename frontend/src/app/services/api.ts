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
  foto?: string; // 👈 Adicionado para aceitar o campo antigo sem conflito
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
  motivo_cancelamento?: string;
  avaliacao_id?: number; // 👈 NOVO: Adicionado para controlar se o agendamento já foi avaliado
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // Auxiliar para pegar os cabeçalhos com Token HTTP
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  login(username: string, password: string): Observable<{ token: string; tipo: string; username: string }> {
    // Força o envio das chaves 'username' e 'password' que o Django exige
    return this.http.post<{ token: string; tipo: string; username: string }>(
      `${this.baseUrl}/login/`,
      { username: username, password: password }
    );
  }

  cadastrar(dados: { username: string; email: string; password: string; nome?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/cadastrar/`, dados);
  }

  // Verificação de E-mail (OTP / Código de Ativação)
  verificarCodigoEmail(dados: { email: string; codigo: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/verificar-email/`, dados);
  }

  // 👇 NOVA FUNCIONALIDADE: Recuperação de Senha 👇
  solicitarResetSenha(payload: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/recuperar-senha/solicitar/`, payload);
  }

  confirmarResetSenha(payload: { email: string, codigo: string, nova_senha: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/recuperar-senha/confirmar/`, payload);
  }
  // 👆 FIM DA RECUPERAÇÃO DE SENHA 👆

  // Estabelecimentos
  getEstabelecimentos(): Observable<Estabelecimento[]> {
    return this.http.get<Estabelecimento[]>(`${this.baseUrl}/estabelecimentos/`, { headers: this.getHeaders() });
  }

  favoritarEstabelecimento(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/estabelecimentos/${id}/favoritar/`, {}, { headers: this.getHeaders() });
  }

  cadastrarEstabelecimento(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/cadastrar-estabelecimento/`, payload);
  }

  // Buscar Avaliações por Estabelecimento
  getAvaliacoesPorEstabelecimento(estabelecimentoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/avaliacoes/?estabelecimento=${estabelecimentoId}`, { headers: this.getHeaders() });
  }

  // Serviços por Estabelecimento
  getServicosPorEstabelecimento(estabelecimentoId: number): Observable<Servico[]> {
    return this.http.get<Servico[]>(`${this.baseUrl}/servicos/?estabelecimento=${estabelecimentoId}`, { headers: this.getHeaders() });
  }

  // Gestão de Serviços (CRUD)
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

    // Se o componente enviar uma data (ex: '2026-08-20'), adiciona na URL
    if (data) {
      url += `?data=${data}`;
    }

    return this.http.get(url, { headers: this.getHeaders() });
  }

  // Veículos
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

  // Perfil
  getMeuPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.baseUrl}/perfis/me/`, { headers: this.getHeaders() });
  }

  atualizarPerfil(payload: any): Observable<Perfil> {
    return this.http.patch<Perfil>(`${this.baseUrl}/perfis/me/`, payload, { headers: this.getHeaders() });
  }

  // Agendamentos
  getAgendamentos(): Observable<Agendamento[]> {
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamentos/`, { headers: this.getHeaders() });
  }

  criarAgendamento(payload: any): Observable<Agendamento> {
    return this.http.post<Agendamento>(`${this.baseUrl}/agendamentos/`, payload, { headers: this.getHeaders() });
  }
// Buscar horários ocupados de um estabelecimento em uma data específica
  getHorariosOcupados(estabelecimentoId: number, data: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/agendamentos/horarios_ocupados/?estabelecimento=${estabelecimentoId}&data=${data}`, {
      headers: this.getHeaders()
    });
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

  // Enviar Avaliação
  enviarAvaliacao(payload: { agendamento: number, estabelecimento: number, nota: number, comentario: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/avaliacoes/`, payload, { headers: this.getHeaders() });
  }

  // Atualizar/Editar Avaliação existente
  atualizarAvaliacao(id: number, payload: { nota: number; comentario: string }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/avaliacoes/${id}/`, payload, { headers: this.getHeaders() });
  }

  // Apagar/Deletar Avaliação existente
  deletarAvaliacao(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/avaliacoes/${id}/`, { headers: this.getHeaders() });
  }
}
