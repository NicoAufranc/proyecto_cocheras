import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Cochera } from '../interfaces/cochera';

@Injectable({
  providedIn: 'root'
})

export class CocherasService {

  auth = inject(AuthService);

  cocheras() {
    return fetch('http://localhost:4000/cocheras', {
      method: 'GET',
      headers: {
        Authorization: "Bearer " + (this.auth.getToken() ?? '')
      },
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Error: Unauthorized or other server issue.");
    }).catch(error => {
      console.error(error);
      return null; 
    });
  }

  agregarCochera(cochera: Cochera) {
    console.log(this.auth.getToken());
    return fetch('http://localhost:4000/cocheras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: "Bearer " + (this.auth.getToken() ?? '')
      },
      body: JSON.stringify(cochera)
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Error: Unauthorized or other server issue.");
    }).catch(error => {
      console.error(error);
      return null;
    });
  }

  eliminarCochera(id: number) {
    return fetch(`http://localhost:4000/cocheras/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: "Bearer " + (this.auth.getToken() ?? '')
      }
    }).then(r => r.json());
  }

  cambiarDisponibilidadCochera(cochera: Cochera, opcion: string) {
    return fetch(`http://localhost:4000/cocheras/${cochera.id}/${opcion}`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        Authorization: "Bearer " + (this.auth.getToken() ?? '')
      },
      body: JSON.stringify(cochera)
    }).then(response => {
      if (response.ok) {
        return response.json(); 
      }
      throw new Error("Error: Unauthorized or other server issue.");
    }).catch(error => {
      console.error(error);
      return null; 
    });
  }
  
}
