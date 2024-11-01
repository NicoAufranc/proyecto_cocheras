import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Estacionamiento } from '../interfaces/estacionamiento';

@Injectable({
  providedIn: 'root'
})
export class EstacionamientosService {
  auth = inject(AuthService);

  // Método para obtener estacionamientos activos
  buscarEstacionamientoActivo(idCochera: number) {
    return fetch(`http://localhost:4000/estacionamientos/cochera/${idCochera}`, {
      method: 'GET',
      headers: {
        Authorization: "Bearer " + this.auth.getToken(),
        'Content-Type': 'application/json'
      },
    }).then(response => {
      if (!response.ok) throw new Error('Unauthorized');
      return response.json();
    });
  }

  estacionarAuto(patente: string, idCochera: number) {
    const username = this.auth.getUsername(); 
    return fetch(`http://localhost:4000/estacionamientos/abrir`, {
      method: 'POST',
      headers: {
        Authorization: "Bearer " + this.auth.getToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patente,
        idCochera,
        username
      })
    }).then(response => {
      if (!response.ok) throw new Error('Error al abrir el estacionamiento');
      return response.json();
    });
  }
  
  cobrarEstacionamiento(idCochera: number, patente: string, costo: number) {
    return fetch(`http://localhost:4000/estacionamientos/cerrar/`, {
      method: 'PATCH',
      headers: {
        Authorization: "Bearer " + this.auth.getToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patente: patente,
        idCochera: idCochera,
        costo: costo 
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(error => {
          throw new Error(error.message);
        });
      }
      return response.json();
    });
}

}
