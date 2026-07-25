import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  @Input() abaAtiva: string = 'buscar';
  @Output() mudarAba = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  menuAberto: boolean = false;

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  selecionarAba(aba: string): void {
    this.mudarAba.emit(aba);
    this.menuAberto = false;
  }

  executarLogout(): void {
    this.menuAberto = false;
    this.logout.emit();
  }
}
