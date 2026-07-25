import { Component } from '@angular/core';
import { AgendamentoComponent } from './components/agendamento/agendamento';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgendamentoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'smartwash-ui';
}
