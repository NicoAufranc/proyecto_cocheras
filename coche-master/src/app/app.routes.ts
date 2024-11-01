import { Router, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { EstadoCocherasComponent } from './pages/estado-cocheras/estado-cocheras.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

function guardaLogueado(){
  let auth = inject(AuthService);
  let router = inject(Router);

  if (auth.estaLogueado()){
    return true;
    
}   else{
    router.navigate(['/login']);
    return false;
}
}

export const routes: Routes = [
    {
        path: "login",
        component: LoginComponent

    },
    {
        path: "estado-cocheras",
        component: EstadoCocherasComponent,
        canActivate:[guardaLogueado]
    },
    {
        path: "",
        redirectTo: "login",
        pathMatch: "full"
    }
];
