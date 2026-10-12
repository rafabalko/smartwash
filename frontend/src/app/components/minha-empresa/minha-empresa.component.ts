import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService, Estabelecimento } from '../../services/api';

@Component({
  selector: 'app-minha-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minha-empresa.component.html',
  styleUrl: './minha-empresa.component.scss'
})
export class MinhaEmpresaComponent implements OnInit {
  estabelecimento: Estabelecimento = {
    id: 0,
    nome_fantasia: '',
    razao_social: '',
    endereco: '',
    telefone: '',
    descricao: '',
    imagem: undefined,
    ativo: true,
    is_favorito: false
  };

  carregando: boolean = true;
  salvando: boolean = false;

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  // 📸 Variáveis para controlar a foto
  arquivoSelecionado: File | null = null;
  previewFoto: string | ArrayBuffer | null = null;

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.carregarDadosEmpresa();
  }

  carregarDadosEmpresa(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.apiService.getEstabelecimentos().subscribe({
      next: (dados: any) => {
        console.log('Dados recebidos da API:', dados);

        // Tratamento seguro: se vier uma lista, pega o primeiro item; se vier um objeto, usa ele direto
        const empresa = Array.isArray(dados) ? dados[0] : dados;

        if (empresa && empresa.id) {
          this.estabelecimento = { ...empresa };
          console.log('ID da empresa carregado com sucesso:', this.estabelecimento.id);
        } else {
          this.mensagemErro = 'Nenhum estabelecimento vinculado a este usuário administrador.';
        }
        this.carregando = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar dados da empresa:', err);
        this.carregando = false;
        this.mensagemErro = 'Erro ao carregar dados da empresa.';
      }
    });
  }

  // 📸 Método disparado quando o administrador seleciona uma foto
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.arquivoSelecionado = file;

      // Gera a pré-visualização da imagem na tela antes de salvar
      const reader = new FileReader();
      reader.onload = () => this.previewFoto = reader.result;
      reader.readAsDataURL(file);
    }
  }

  // 🚀 FUNÇÃO ADICIONADA: Formata a URL da imagem para aparecer quando reabrir a aba
  formatarImagem(url: string | undefined | null): string {
    if (!url) {
      return 'assets/img/lava-rapido-padrao.png'; // Retorna a imagem padrão se não tiver foto
    }
    // Se a URL já for completa (ex: vem de nuvem), retorna ela mesma
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Adiciona o endereço do backend local para as imagens /media/
    return `http://127.0.0.1:8000${url}`;
  }

  salvarDadosEmpresa(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    // 🔍 Validação blindada: impede o envio se o ID não estiver carregado
    if (!this.estabelecimento.id || this.estabelecimento.id === 0) {
      this.mensagemErro = 'ID da empresa não encontrado. Aguarde o carregamento completo ou atualize a página.';
      return;
    }

    this.salvando = true;

    // 🚀 Transformando os dados em FormData para suportar o envio da imagem
    const formData = new FormData();
    formData.append('nome_fantasia', this.estabelecimento.nome_fantasia || '');
    formData.append('razao_social', this.estabelecimento.razao_social || '');
    formData.append('endereco', this.estabelecimento.endereco || '');
    formData.append('telefone', this.estabelecimento.telefone || '');
    formData.append('descricao', this.estabelecimento.descricao || '');

    // Se o usuário selecionou uma foto nova, enviamos para o backend
    if (this.arquivoSelecionado) {
      formData.append('imagem', this.arquivoSelecionado, this.arquivoSelecionado.name);
    }

    // Recupera o token de autenticação
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    this.http.patch(`http://127.0.0.1:8000/api/estabelecimentos/${this.estabelecimento.id}/`, formData, { headers })
      .subscribe({
        next: (res: any) => {
          this.salvando = false;
          this.estabelecimento = { ...res };
          this.mensagemSucesso = 'Informações e imagem atualizadas com sucesso!';
          this.arquivoSelecionado = null; // Limpa o estado da foto selecionada
        },
        error: (err: any) => {
          console.error('Erro ao salvar empresa:', err);
          this.salvando = false;
          this.mensagemErro = err.error?.detail || 'Erro ao salvar alterações da empresa.';
        }
      });
  }
}
