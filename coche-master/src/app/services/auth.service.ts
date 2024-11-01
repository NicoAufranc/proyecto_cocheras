import { Injectable } from '@angular/core';
import { Login } from '../interfaces/login';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  getToken(): string {
    return localStorage.getItem('token') ?? '';
  }

  getIdUsuario(): string {
    return JSON.parse(atob(this.getToken().split('.')[1])).id;
  }

  getUsername(): string {
    return JSON.parse(atob(this.getToken().split('.')[1])).username;
  }

  login(datosLogin: Login) {
    return fetch("http://localhost:4000/login", {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(datosLogin),
    }).then(res => res.json().then(resJson => {
      if (resJson.status === 'ok') {
        localStorage.setItem('token', resJson.token);
        return true;
      } else {
        return false;
      }
      console.log('Recibí una respuesta del backend', resJson);
    }));
  }

  estaLogueado(): boolean {
    return !!this.getToken();
  }
}
