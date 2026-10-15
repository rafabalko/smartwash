import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Estabelecimento } from '../../services/api';

@Component({
  selector: 'app-minha-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minha-empresa.component.html',
  styleUrl: './minha-empresa.component.scss'
})
export class MinhaEmpresaComponent implements OnInit {
  estabelecimento: Estabelecimento & { limite_carros_diario?: number; vagas_simultaneas?: number } = {
    id: 0,
    nome_fantasia: '',
    endereco: '',
    telefone: '',
    descricao: '',
    imagem: undefined,
    ativo: true,
    is_favorito: false,
    limite_carros_diario: 3,
    vagas_simultaneas: 1
  };

  carregando: boolean = true;
  salvando: boolean = false;

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  arquivoSelecionado: File | null = null;
  previewFoto: string | ArrayBuffer | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarDadosEmpresa();
  }

  carregarDadosEmpresa(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.apiService.getEstabelecimentos().subscribe({
      next: (res: any) => {
        const lista = res.results ? res.results : res;
        const empresa = Array.isArray(lista) ? lista[0] : lista;

        if (empresa && empresa.id) {
          this.estabelecimento = {
            limite_carros_diario: 3,
            vagas_simultaneas: 1,
            ...empresa
          };
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

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.arquivoSelecionado = file;

      const reader = new FileReader();
      reader.onload = () => (this.previewFoto = reader.result);
      reader.readAsDataURL(file);
    }
  }

  formatarImagem(url: string | undefined | null): string {
    if (!url) {
      return 'assets/img/lava-rapido-padrao.png';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://smartwash-spyf.onrender.com${url}`;
  }

  salvarDadosEmpresa(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    if (!this.estabelecimento.id || this.estabelecimento.id === 0) {
      this.mensagemErro = 'ID da empresa não encontrado. Aguarde o carregamento completo ou atualize a página.';
      return;
    }

    this.salvando = true;

    const formData = new FormData();
    formData.append('nome_fantasia', this.estabelecimento.nome_fantasia || '');
    formData.append('endereco', this.estabelecimento.endereco || '');
    formData.append('telefone', this.estabelecimento.telefone || '');
    formData.append('descricao', this.estabelecimento.descricao || '');

    formData.append('limite_carros_diario', (this.estabelecimento.limite_carros_diario || 3).toString());
    formData.append('vagas_simultaneas', (this.estabelecimento.vagas_simultaneas || 1).toString());

    if (this.arquivoSelecionado) {
      formData.append('imagem', this.arquivoSelecionado, this.arquivoSelecionado.name);
    }

    this.apiService.atualizarEstabelecimentoFormData(this.estabelecimento.id, formData).subscribe({
      next: (res: any) => {
        this.salvando = false;
        this.estabelecimento = { ...res };
        this.mensagemSucesso = 'Informações e configurações de capacidade salvas com sucesso!';
        this.arquivoSelecionado = null;
      },
      error: (err: any) => {
        console.error('Erro ao salvar empresa:', err);
        this.salvando = false;
        this.mensagemErro = err.error?.detail || err.error?.error || 'Erro ao salvar alterações da empresa.';
      }
    });
  }
}
