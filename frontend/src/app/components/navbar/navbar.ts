import { Component, Output, EventEmitter, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  @Input() isLoggedIn: boolean = false;
  @Input() abaAtiva: string = 'buscar';
  @Input() userTipo: string = 'CLIENTE';

  @Output() mudarAba = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  menuAberto: boolean = false;
  menuPerfilAberto: boolean = false;

  constructor(private eRef: ElementRef) {}

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  toggleMenuPerfil(): void {
    this.menuPerfilAberto = !this.menuPerfilAberto;
  }

  selecionarAba(aba: string): void {
    this.mudarAba.emit(aba);
    this.fecharMenus();
  }

  fecharMenus(): void {
    this.menuAberto = false;
    this.menuPerfilAberto = false;
  }

  executarLogout(): void {
    this.fecharMenus();
    this.logout.emit();
  }

  // Fecha o dropdown automaticamente se o usuário clicar fora da Navbar
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.fecharMenus();
    }
  }
}
