import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Estabelecimento } from '../../services/api';

@Component({
  selector: 'app-busca-estabelecimentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './busca-estabelecimentos.html',
  styleUrl: './busca-estabelecimentos.scss'
})
export class BuscaEstabelecimentosComponent implements OnInit {
  @Output() selecionarEstabelecimento = new EventEmitter<Estabelecimento>();

  estabelecimentos: Estabelecimento[] = [];
  termoBusca: string = '';
  carregando: boolean = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarEstabelecimentos();
  }

  carregarEstabelecimentos(): void {
    this.carregando = true;
    this.apiService.getEstabelecimentos().subscribe({
      next: (data: Estabelecimento[]) => {
        this.estabelecimentos = data;
        this.carregando = false;
      },
      error: (err: any) => {
        console.error(err);
        this.carregando = false;
      }
    });
  }

  get estabelecimentosFiltrados(): Estabelecimento[] {
    if (!this.termoBusca) return this.estabelecimentos;
    return this.estabelecimentos.filter(e =>
      e.nome_fantasia.toLowerCase().includes(this.termoBusca.toLowerCase()) ||
      (e.endereco && e.endereco.toLowerCase().includes(this.termoBusca.toLowerCase()))
    );
  }

  agendar(estab: Estabelecimento): void {
    this.selecionarEstabelecimento.emit(estab);
  }


  formatarImagem(url: string | undefined | null): string {
    if (!url) return 'https://via.placeholder.com/300x160?text=Sem+Foto';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://smartwash-spyf.onrender.com${url}`;
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
    const mensagem = encodeURIComponent(`Olá! Encontrei o ${nomeLavaRapido} no aplicativo SmartWash e gostaria de saber mais.`);
    window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
  }

  abrirMaps(endereco: string, event: Event): void {
    event.stopPropagation();
    if (!endereco) return;
    const enderecoFormatado = encodeURIComponent(endereco);
    window.open(`https://www.google.com/maps/search/?api=1&query=${enderecoFormatado}`, '_blank');
  }

  favoritar(e: any, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    e.is_favorito = !e.is_favorito;

    this.apiService.favoritarEstabelecimento(e.id).subscribe({
      next: (res: any) => {
        if (res && typeof res.is_favorito === 'boolean') {
          e.is_favorito = res.is_favorito;
        }
      },
      error: (err: any) => {
        e.is_favorito = !e.is_favorito;
        console.error(err);
      }
    });
  }
}
