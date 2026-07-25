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
      next: (data) => {
        this.estabelecimentos = data;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar estabelecimentos:', err);
        this.carregando = false;
      }
    });
  }

  get estabelecimentosFiltrados(): Estabelecimento[] {
    if (!this.termoBusca.trim()) {
      return this.estabelecimentos;
    }
    const termo = this.termoBusca.toLowerCase();
    return this.estabelecimentos.filter(e =>
      e.nome_fantasia.toLowerCase().includes(termo) ||
      e.endereco.toLowerCase().includes(termo)
    );
  }

  favoritar(e: Estabelecimento, event: Event): void {
    event.stopPropagation();
    this.apiService.toggleFavorito(e.id).subscribe({
      next: () => {
        e.is_favorito = !e.is_favorito;
      },
      error: (err) => console.error('Erro ao favoritar', err)
    });
  }

  agendar(e: Estabelecimento): void {
    this.selecionarEstabelecimento.emit(e);
  }
}
