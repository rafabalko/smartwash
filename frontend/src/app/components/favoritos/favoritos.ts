import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Estabelecimento } from '../../services/api';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.scss'
})
export class FavoritosComponent implements OnInit {
  @Output() selecionarEstabelecimento = new EventEmitter<Estabelecimento>();

  favoritos: Estabelecimento[] = [];
  carregando: boolean = true;
  mensagemErro: string = '';
  mensagemSucesso: string = '';

  constructor(private apiService: ApiService) {}
  ngOnInit(): void {
    this.carregarFavoritos();
  }

  carregarFavoritos(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.apiService.getEstabelecimentos().subscribe({
      next: (dados: Estabelecimento[]) => {
        this.favoritos = dados.filter(e => e.is_favorito);
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar favoritos:', err);
        this.mensagemErro = 'Não foi possível carregar seus favoritos.';
        this.carregando = false;
      }
    });
  }

  desfavoritar(e: Estabelecimento, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.apiService.favoritarEstabelecimento(e.id).subscribe({
      next: () => {
        this.mensagemSucesso = `${e.nome_fantasia} foi removido!`;
        this.favoritos = this.favoritos.filter(item => item.id !== e.id);
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => console.error('Erro ao desfavoritar:', err)
    });
  }

  agendar(e: Estabelecimento): void {
    this.selecionarEstabelecimento.emit(e);
  }

  formatarImagem(imagem: string | null | undefined): string {
    if (!imagem) {
      return 'assets/img/lava-rapido-padrao.png';
    }
    return imagem;
  }

  formatarEnderecoReduzido(endereco: string): string {
    if (!endereco) return '';

    // Procura por ", CEP" (ou apenas "CEP") e remove ele e tudo o que vier depois
    return endereco.replace(/,?\s*CEP.*$/i, '').trim();
  }

  abrirWhatsApp(telefone: string, nomeLavaRapido: string, event: Event): void {
    event.stopPropagation();
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá! Encontrei o ${nomeLavaRapido} no aplicativo e gostaria de saber mais.`);
    window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
  }

  abrirMaps(endereco: string, event: Event): void {
    event.stopPropagation();
    if (!endereco) return;
    const enderecoFormatado = encodeURIComponent(endereco);
    window.open(`https://maps.google.com/?q=${enderecoFormatado}`, '_blank');
  }
}
