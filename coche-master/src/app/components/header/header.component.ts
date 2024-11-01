import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  titulo = input<string>('ESTADO COCHERAS');
  esAdmin: boolean = true;
}
