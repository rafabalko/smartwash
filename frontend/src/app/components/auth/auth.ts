import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class AuthComponent {
  modoCadastro: boolean = false;
  modoEmpresaCadastro: boolean = false;
  passoEmpresa: number = 1; // Controla se está no Passo 1 (Dados) ou Passo 2 (Endereço)
  etapaVerificacao: boolean = false;

  // 👇 VARIÁVEIS DE RECUPERAÇÃO DE SENHA
  modoRecuperacaoSenha: boolean = false;
  etapaRecuperacao: number = 1; // 1: Pede e-mail | 2: Pede código | 3: Pede nova senha
  novaSenhaInput: string = '';

  // 👇 Variável unificada que controla o olhinho em TODAS as telas
  mostrarSenha: boolean = false;

  // Inputs Comuns
  emailInput: string = '';
  passwordInput: string = '';
  nomeInput: string = '';
  sobrenomeInput: string = ''; // 👤 NOVO: Campo de sobrenome

  // Inputs Exclusivos da Empresa (e agora Telefone usado pelo Cliente também)
  nomeFantasiaInput: string = '';
  telefoneInput: string = '';

  // Inputs de Endereço (Passo 2)
  cepInput: string = '';
  ruaInput: string = '';
  numeroInput: string = '';
  bairroInput: string = '';
  cidadeInput: string = '';
  ufInput: string = '';

  codigoInput: string = '';
  emailCadastradoParaVerificacao: string = '';

  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  alternarModo(): void {
    this.modoCadastro = !this.modoCadastro;
    this.modoEmpresaCadastro = false;
    this.etapaVerificacao = false;
    this.modoRecuperacaoSenha = false; // Garante que fecha a recuperação
    this.passoEmpresa = 1;
    this.limparCampos();
  }

  alternarParaEmpresa(): void {
    this.modoCadastro = true;
    this.modoEmpresaCadastro = true;
    this.etapaVerificacao = false;
    this.modoRecuperacaoSenha = false; // Garante que fecha a recuperação
    this.passoEmpresa = 1;
    this.limparCampos();
  }

  // --- FUNÇÕES DE RECUPERAÇÃO DE SENHA E UI ---

  abrirRecuperacaoSenha(): void {
    this.modoRecuperacaoSenha = true;
    this.modoCadastro = false;
    this.modoEmpresaCadastro = false;
    this.etapaVerificacao = false;
    this.etapaRecuperacao = 1;
    this.limparCampos();
  }

  voltarParaLogin(): void {
    this.modoRecuperacaoSenha = false;
    this.limparCampos();
  }

  toggleMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  solicitarRecuperacao(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.emailInput) {
      this.mensagemErro = 'Por favor, informe o seu e-mail cadastrado.';
      return;
    }

    this.carregando = true;
    this.apiService.solicitarResetSenha({ email: this.emailInput }).subscribe({
      next: (res: any) => {
        this.carregando = false;
        this.mensagemSucesso = res.mensagem || 'Se o e-mail estiver cadastrado, um código foi enviado.';
        this.etapaRecuperacao = 2; // Vai para a tela de digitar o código
      },
      error: (err: any) => {
        this.carregando = false;
        this.mensagemErro = 'Ocorreu um erro ao solicitar a recuperação.';
      }
    });
  }

  avancarParaSenha(): void {
    this.mensagemErro = '';
    if (!this.codigoInput || this.codigoInput.length < 6) {
      this.mensagemErro = 'Por favor, digite o código completo de 6 dígitos.';
      return;
    }
    this.etapaRecuperacao = 3; // Vai para a tela de digitar a nova senha
  }

  confirmarNovaSenha(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.novaSenhaInput) {
      this.mensagemErro = 'Preencha a nova senha.';
      return;
    }

    this.carregando = true;
    const payload = {
      email: this.emailInput,
      codigo: this.codigoInput,
      nova_senha: this.novaSenhaInput
    };

    this.apiService.confirmarResetSenha(payload).subscribe({
      next: (res: any) => {
        this.carregando = false;
        this.mensagemSucesso = 'Senha alterada com sucesso! Faça login.';
        setTimeout(() => {
          this.voltarParaLogin();
        }, 2500); // Aguarda 2.5s e volta para o login sozinho
      },
      error: (err: any) => {
        this.carregando = false;
        this.mensagemErro = err.error?.erro || 'Erro ao alterar a senha. Verifique se o código está correto.';
        this.etapaRecuperacao = 2; // Se der erro no código, recua para a etapa de digitar o código!
      }
    });
  }

  // --- FIM DAS FUNÇÕES DE RECUPERAÇÃO DE SENHA ---

  limparCampos(): void {
    this.emailInput = '';
    this.passwordInput = '';
    this.novaSenhaInput = ''; // Limpa a nova senha
    this.mostrarSenha = false; // Garante que a senha fica oculta ao limpar os dados
    this.nomeInput = '';
    this.sobrenomeInput = '';
    this.codigoInput = '';
    this.nomeFantasiaInput = '';
    this.telefoneInput = '';
    this.cepInput = '';
    this.ruaInput = '';
    this.numeroInput = '';
    this.bairroInput = '';
    this.cidadeInput = '';
    this.ufInput = '';
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  avancarPassoEmpresa(): void {
    this.mensagemErro = '';
    // 🔒 VALIDAÇÃO: Bloqueia avanço se faltar Nome, Sobrenome ou os demais campos
    if (!this.nomeInput.trim() || !this.sobrenomeInput.trim() || !this.nomeFantasiaInput.trim() || !this.telefoneInput.trim() || !this.emailInput.trim() || !this.passwordInput) {
      this.mensagemErro = 'Preencha todos os campos obrigatórios para avançar.';
      return;
    }
    this.passoEmpresa = 2; // Vai para a tela de endereço
  }

  voltarPassoEmpresa(): void {
    this.passoEmpresa = 1;
  }

  fazerLogin(): void {
    this.mensagemErro = '';
    if (!this.emailInput || !this.passwordInput) {
      this.mensagemErro = 'Preencha o seu e-mail e palavra-passe.';
      return;
    }
    this.carregando = true;

    // this.emailInput é o valor digitado no campo de e-mail do login
    this.apiService.login(this.emailInput, this.passwordInput).subscribe({
      next: (res: any) => {
        this.carregando = false;
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('user_tipo', res.tipo || 'CLIENTE');
        if (res.tipo === 'ADMIN') {
          window.location.href = '/minha-empresa';
        } else {
          window.location.reload();
        }
      },
      error: () => {
        this.carregando = false;
        this.mensagemErro = 'E-mail ou senha inválidos.';
      }
    });
  }

  fazerCadastro(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    // 🔒 VALIDAÇÃO FRONTAL PARA CLIENTE COMUM:
    // Garante que o cliente preencheu nome, sobrenome, telefone, email e senha
    if (!this.modoEmpresaCadastro) {
      if (!this.nomeInput.trim() || !this.sobrenomeInput.trim() || !this.telefoneInput.trim() || !this.emailInput.trim() || !this.passwordInput) {
        this.mensagemErro = 'Por favor, preencha todos os campos (Nome, Sobrenome, Telefone, E-mail e Senha).';
        return;
      }
    }

    this.carregando = true;

    // Limpa qualquer vestígio de sessão anterior pendente
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_tipo');

    // Concatena o nome para usar nos locais onde o backend exige um nome único
    const nomeCompleto = `${this.nomeInput.trim()} ${this.sobrenomeInput.trim()}`;

    if (this.modoEmpresaCadastro) {
      if (!this.ruaInput || !this.numeroInput || !this.bairroInput || !this.cidadeInput) {
        this.carregando = false;
        this.mensagemErro = 'Preencha o endereço completo.';
        return;
      }

      const enderecoCompleto = `${this.ruaInput}, ${this.numeroInput} - ${this.bairroInput}, ${this.cidadeInput} - ${this.ufInput}, CEP: ${this.cepInput}`;

      const payloadEmpresa = {
        email: this.emailInput,
        password: this.passwordInput,
        first_name: this.nomeInput.trim(),       // Enviando separado (padrão User Django)
        last_name: this.sobrenomeInput.trim(),   // Enviando separado
        nome_dono: nomeCompleto,                 // Enviando completo concatenado
        nome_fantasia: this.nomeFantasiaInput,
        endereco: enderecoCompleto,
        telefone: this.telefoneInput
      };

      this.apiService.cadastrarEstabelecimento(payloadEmpresa).subscribe({
        next: (res: any) => {
          this.carregando = false;
          this.mensagemSucesso = res.mensagem || 'Empresa registrada! Verifique o seu e-mail.';
          this.emailCadastradoParaVerificacao = this.emailInput;
          this.etapaVerificacao = true;
        },
        error: (err) => {
          this.carregando = false;
          this.mensagemErro = err.error?.error || 'Erro ao registrar estabelecimento. Este e-mail já pode estar em uso.';
        }
      });

    } else {

      // 📱 PAYLOAD DO CLIENTE (Agora enviando first_name, last_name e TELEFONE)
      const payloadCliente = {
        username: this.emailInput,
        email: this.emailInput,
        password: this.passwordInput,
        first_name: this.nomeInput.trim(),
        last_name: this.sobrenomeInput.trim(),
        nome: nomeCompleto,
        telefone: this.telefoneInput // 👈 Inserindo o telefone no cadastro!
      };

      this.apiService.cadastrar(payloadCliente).subscribe({
        next: (res: any) => {
          this.carregando = false;
          this.mensagemSucesso = 'Conta criada! Verifique o seu e-mail.';
          this.emailCadastradoParaVerificacao = this.emailInput;
          this.etapaVerificacao = true;
        },
        error: (err) => {
          this.carregando = false;
          this.mensagemErro = 'Erro ao realizar registro. Verifique se o e-mail já existe.';
        }
      });
    }
  }

  confirmarCodigo(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.codigoInput) {
      this.mensagemErro = 'Digite o código de verificação.';
      return;
    }

    this.carregando = true;
    const dados = {
      email: this.emailCadastradoParaVerificacao,
      codigo: this.codigoInput
    };

    this.apiService.verificarCodigoEmail(dados).subscribe({
      next: (res: any) => {
        this.carregando = false;

        localStorage.clear();
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('user_tipo', res.tipo || 'CLIENTE');

        if (res.tipo === 'ADMIN') {
          window.location.href = '/minha-empresa';
        } else {
          window.location.reload();
        }
      },
      error: (err) => {
        this.carregando = false;
        this.mensagemErro = err.error?.erro || 'Código incorreto ou expirado.';
      }
    });
  }

  aplicarMascaraTelefone(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*$/, '($1) $2-$3');
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*$/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,5}).*$/, '($1) $2');
    } else if (valor.length > 0) {
      valor = valor.replace(/^(\d{0,2}).*$/, '($1');
    }
    this.telefoneInput = valor;
  }

  aplicarMascaraCep(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.substring(0, 8);
    if (valor.length > 5) {
      valor = valor.replace(/^(\d{5})(\d{1,3}).*$/, '$1-$2');
    }
    this.cepInput = valor;

    if (valor.replace(/\D/g, '').length === 8) {
      this.buscarDadosCep(valor.replace(/\D/g, ''));
    }
  }

  buscarDadosCep(cep: string): void {
    this.carregando = true;
    this.mensagemErro = '';

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => response.json())
      .then(dados => {
        this.carregando = false;
        if (dados.erro) {
          this.mensagemErro = 'CEP não encontrado.';
        } else {
          this.ruaInput = dados.logradouro;
          this.bairroInput = dados.bairro;
          this.cidadeInput = dados.localidade;
          this.ufInput = dados.uf;
          this.mensagemSucesso = 'Endereço encontrado!';
        }
      })
      .catch(err => {
        this.carregando = false;
        this.mensagemErro = 'Erro ao buscar o CEP.';
      });
  }
}
