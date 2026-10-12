import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Estabelecimento, Servico, Agendamento } from '../../services/api';

@Component({
  selector: 'app-detalhes-estabelecimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalhes-estabelecimento.html',
  styleUrl: './detalhes-estabelecimento.scss'
})
export class DetalhesEstabelecimentoComponent implements OnInit {
  @Input() estabelecimento!: Estabelecimento;
  @Output() irParaAgendamento = new EventEmitter<void>();
  @Output() voltarBusca = new EventEmitter<void>();

  servicos: Servico[] = [];

  // Variáveis Reais de Avaliação (Vindas do Django)
  avaliacoes: any[] = [];
  mediaNotas: number = 0;

  // Controle do Agendamento elegível para avaliação
  agendamentoElegivelParaAvaliar: Agendamento | null = null;
  notaAvaliacao: number = 0;
  comentarioAvaliacao: string = '';

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    if (this.estabelecimento) {
      // 1. Carrega os serviços do lava-rápido (blindado contra paginação)
      this.apiService.getServicosPorEstabelecimento(this.estabelecimento.id).subscribe({
        next: (res: any) => {
          this.servicos = res.results ? res.results : res;
        },
        error: (err) => console.error(err)
      });

      // 2. Carrega as avaliações reais e calcula a média
      this.carregarAvaliacoes();
    }
  }

  isEstabelecimentoAberto(): boolean {
    const agora = new Date();
    const horaAtual = agora.getHours();
    // Considera aberto entre 08:00 e 17:59
    return horaAtual >= 8 && horaAtual < 18;
  }

  iniciarAgendamento(): void {
    this.irParaAgendamento.emit();
  }

  voltar(): void {
    this.voltarBusca.emit();
  }


  carregarAvaliacoes(): void {
    this.apiService.getAvaliacoesPorEstabelecimento(this.estabelecimento.id).subscribe({
      next: (res: any) => {
        const dados = res.results ? res.results : res;
        this.avaliacoes = dados;

        console.log('Avaliações carregadas:', this.avaliacoes);

        if (this.avaliacoes && this.avaliacoes.length > 0) {
          const soma = this.avaliacoes.reduce((acc, curr) => acc + (Number(curr.nota) || 0), 0);
          const media = soma / this.avaliacoes.length;
          this.mediaNotas = isNaN(media) ? 0 : media;
        } else {
          this.mediaNotas = 0;
        }

        this.verificarAgendamentoPendenteDeAvaliacao();
      },
      error: (err) => console.error('Erro ao carregar avaliações:', err)
    });
  }

  verificarAgendamentoPendenteDeAvaliacao(): void {
    this.apiService.getAgendamentos().subscribe({
      next: (res: any) => {
        const agendamentos = res.results ? res.results : res;

        const pendente = agendamentos.find((a: any) => {
          if (a.estabelecimento !== this.estabelecimento.id || a.status !== 'CONCLUIDO') return false;
          if (a.avaliacao_id) return false;

          // Confirma dupla se a avaliação não está já na lista
          const jaAvaliado = this.avaliacoes.find(aval => aval.agendamento === a.id);
          if (jaAvaliado) return false;

          return true;
        });

        this.agendamentoElegivelParaAvaliar = pendente || null;
      },
      error: (err) => console.error(err)
    });
  }

  enviarAvaliacao(): void {
    if (!this.agendamentoElegivelParaAvaliar) return;

    if (this.notaAvaliacao < 1 || this.notaAvaliacao > 5) {
      this.mensagemErro = 'Por favor, selecione uma nota de 1 a 5 estrelas.';
      return;
    }

    const payload = {
      agendamento: this.agendamentoElegivelParaAvaliar.id,
      estabelecimento: this.estabelecimento.id,
      nota: this.notaAvaliacao,
      comentario: this.comentarioAvaliacao
    };

    this.apiService.enviarAvaliacao(payload).subscribe({
      next: () => {
        this.mensagemSucesso = 'Avaliação enviada com sucesso! Muito obrigado.';
        this.mensagemErro = '';
        this.agendamentoElegivelParaAvaliar = null;
        this.notaAvaliacao = 0;
        this.comentarioAvaliacao = '';
        this.carregarAvaliacoes();
      },
      error: (err) => {
        console.error(err);
        this.mensagemErro = 'Erro ao enviar avaliação. Talvez você já tenha avaliado este serviço.';
        this.agendamentoElegivelParaAvaliar = null;
      }
    });
  }

  abrirWhatsApp(telefone: string, nomeLavaRapido: string): void {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá! Encontrei o ${nomeLavaRapido} na plataforma SmartWash e gostaria de tirar uma dúvida.`);
    window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
  }

  abrirMaps(endereco: string): void {
    if (!endereco) return;
    const enderecoFormatado = encodeURIComponent(endereco);
    window.open(`https://www.google.com/maps/search/?api=1&query=${enderecoFormatado}`, '_blank');
  }
}
