import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Cochera } from '../../interfaces/cochera';
import { HeaderComponent } from "../../components/header/header.component";
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { EstacionamientosService } from '../../services/estacionamientos.service';
import { CocherasService } from '../../services/cocheras.service';

@Component({
  selector: 'app-estado-cocheras',
  standalone: true,
  imports: [RouterModule, CommonModule, HeaderComponent],
  templateUrl: './estado-cocheras.component.html',
  styleUrl: './estado-cocheras.component.scss'
})

export class EstadoCocherasComponent {
  titulo = 'ESTADO DE COCHERAS';
  header = {
    nro: 'Nro',
    disponibilidad: 'Disponibilidad',
    ingreso: 'Ingreso',
    acciones: 'Acciones',
  };

  filas: Cochera[] = [];
  siguienteNumero: number = 1;
  auth = inject(AuthService);
  cocheras = inject(CocherasService);
  estacionamientos = inject(EstacionamientosService);

  async agregarFila() {
    const nuevaCochera: Cochera = {
      descripcion: 'Disponible', 
      id: 0,
      deshabilitada: false,
      eliminada: false,
      activo: false
    };

    try {
      // Persistencia en la base de datos usando el servicio de cocheras
      await this.cocheras.agregarCochera(nuevaCochera);

      this.traerCocheras();
    } catch (error) {
      console.error('Error al agregar la cochera en la base de datos:', error);
      Swal.fire('Error', 'No se pudo agregar la cochera en la base de datos.', 'error');
    }
  }

  eliminarFila(index: number, event: Event) {
    event.stopPropagation();
    
    const cocheraId = this.filas[index].id; 

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Una vez eliminada, no podrás recuperar esta cochera.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Eliminar la cochera en la base de datos
          await this.cocheras.eliminarCochera(cocheraId);
          
          // Luego eliminar la cochera de la lista en la interfaz
          this.filas.splice(index, 1);
          Swal.fire('Eliminada', 'La cochera ha sido eliminada.', 'success');
        } catch (error) {
          console.error('Error al eliminar la cochera en la base de datos:', error);
          Swal.fire('Error', 'No se pudo eliminar la cochera en la base de datos.', 'error');
        }
      }
    });
  }
  

  cambiarDisponibilidadCochera(numeroFila: number, event: Event) {
    event.stopPropagation();
    const cochera = this.filas[numeroFila];
    const opcion: string = cochera.deshabilitada ? "enable" : "disable"; // Determina la opción
  
    this.cocheras.cambiarDisponibilidadCochera(cochera, opcion).then(() => {
      cochera.deshabilitada = !cochera.deshabilitada; // Cambia el estado en la interfaz
    }).catch(error => {
      console.error('Error al actualizar la cochera en la base de datos:', error);
      Swal.fire('Error', 'No se pudo actualizar la disponibilidad de la cochera en la base de datos.', 'error');
    });
  }
  
  

  ngOnInit() {
    this.traerCocheras();
  }

  traerCocheras() {
    return this.cocheras.cocheras().then(cocheras => {
      const promesas = cocheras.map((c: { id: number; }) =>
        this.estacionamientos.buscarEstacionamientoActivo(c.id).then(estacionamiento => ({
          ...c,
          activo: estacionamiento,
        }))
      );
  
      Promise.all(promesas).then(resultados => {
        this.filas = resultados;
      });
    });
  }
  

  abrirModalNuevoEstacionamiento(idCochera: number) {
    Swal.fire({
      title: "Ingrese la patente del vehículo",
      input: "text",
      inputPlaceholder: "ABP 474",
      confirmButtonColor: "#034CBE",
      confirmButtonText: "Estacionar",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "¡Ingrese una patente válida!";
        }
        return;
      }
    }).then(res => {
      if (res.isConfirmed) {
        this.estacionamientos.estacionarAuto(res.value, idCochera).then(() => {
          Swal.fire("Estacionamiento confirmado", "El vehículo fue estacionado correctamente.", "success");

          this.traerCocheras();
        }).catch(error => {
          console.error("Error al abrir el estacionamiento:", error);
        });
      }
    });
  }

  cobrarEstacionamiento(idCochera: number) {
    this.estacionamientos.buscarEstacionamientoActivo(idCochera).then(estacionamiento => {
      if (!estacionamiento || estacionamiento.length === 0) {
        Swal.fire({
          title: "Error",
          text: "No se encontró un estacionamiento activo para la cochera",
          icon: "error"
        });
        return;
      }

      console.log(estacionamiento)
  
      // Convertir horaIngreso a un objeto Date
      const horaIngreso = new Date(estacionamiento[0].horaIngreso);
      const tiempoTranscurridoMs = new Date().getTime() - horaIngreso.getTime();
      const horas = Math.floor(tiempoTranscurridoMs / (1000 * 60 * 60));
      const minutos = Math.floor((tiempoTranscurridoMs % (1000 * 60 * 60)) / (1000 * 60));
      const precio = (tiempoTranscurridoMs / 1000 / 60 / 60); // Precio por hora, formateado a dos decimales
  
      Swal.fire({
        title: "Cobrar estacionamiento",
        text: `Tiempo transcurrido: ${horas}hs ${minutos}mins - Precio: $${precio.toFixed(2)}`,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#00c98d",
        cancelButtonColor: "#d33",
        confirmButtonText: "Cobrar",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          this.estacionamientos.cobrarEstacionamiento(idCochera, estacionamiento[0].patente, precio).then(() => {
            Swal.fire("Estacionamiento cobrado", "El estacionamiento ha sido cobrado correctamente.", "success");
            this.traerCocheras();
          }).catch(error => {
            console.error("Error al cobrar el estacionamiento:", error);
            Swal.fire("Error", "Hubo un error al cobrar el estacionamiento.", "error");
          });
        }
      });
    }).catch(error => {
      console.error("Error al buscar el estacionamiento activo:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un error al buscar el estacionamiento.",
        icon: "error"
      });
    });
  }
}
