import { db } from "../services/database";
const tabla="estacionamiento"

const getAll = async (req, res) => {
  await db.all(`SELECT * from ${tabla} WHERE eliminado IS NOT 1`, (error,rows)=>{
    if (error) return res.status(500).send(error.message);
    return res.send(rows)
  });
};

const getById = async (req, res) => {
  if(!req.params.id) return res.status(403).json({message:"Falta el ID del estacionamiento"})
  await db.get(`SELECT * from ${tabla} WHERE (id= ? ) and (eliminado IS NOT 1)`,req.params.id ,(error,row)=>{
    if (error) return res.status(500).send(error.message);
    if (!row) return res.json({ message: "Registro de estacionamiento inexistente" });
    return res.send(row)
  });
};

const getByIdCochera = async (req, res) => {
  if(!req.params.id) return res.status(403).json({message:"Falta el ID de la cochera"})
  await db.all(`SELECT * from ${tabla} WHERE (idCochera= ? ) and (eliminado IS NOT 1) and (horaIngreso IS NOT NULL) and (horaEgreso IS NULL)`,req.params.id ,(error,rows)=>{
    if (error) return res.status(500).send(error.message);
    if (!rows) return res.json({ message: "Registro de estacionamiento inexistente" });
    return res.send(rows)
  });
};


const abrir = async (req, res) => {
  try {
    console.log('Datos recibidos en abrir:', req.body);

    if (!req.body.patente) return res.status(400).json({ message: "Falta el valor de patente" });
    if (!req.body.username) return res.status(400).json({ message: "Falta el valor de idUsuarioIngreso" });
    if (!req.body.idCochera) return res.status(400).json({ message: "Falta el valor de idCochera" });

    await db.get(`SELECT * FROM ${tabla} WHERE (eliminado IS NOT 1) AND (idCochera = ?) AND (horaEgreso IS NULL)`, req.body.idCochera, async (error, row) => {
      if (error) return res.status(500).send(error.message);
      if (row) return res.status(400).json({ message: "La cochera ya está ocupada" });
      
      await db.run(`INSERT INTO ${tabla} (patente, idCochera, idUsuarioIngreso, horaIngreso) VALUES (?, ?, ?, DATETIME('now', 'localtime'))`,
        [req.body.patente, req.body.idCochera, req.body.username],
        async function (error) {
          if (error) return res.status(500).send(error.message);
          if (!this.lastID) return res.status(500).json({ message: "No se pudo abrir el estacionamiento" });

          // Actualiza la tabla de cochera para establecer DESHABILITADA a 1 y modificar la descripción con formato DD/MM/AAAA HH:MM
          await db.run(
            `UPDATE cochera 
             SET DESHABILITADA = 1, 
                 DESCRIPCION = 'Ocupado desde ' || strftime('%d/%m/%Y %H:%M', 'now', 'localtime') || ' - Patente: ${req.body.patente}' 
             WHERE id = ?`,
            req.body.idCochera,
            function (error) {
              if (error) return res.status(500).send(error.message);
              if (!this.changes) return res.status(404).json({ message: "No se encontró la cochera para actualizar" });
              
              return res.json({ message: `Cochera ${req.body.idCochera} abierta, deshabilitada, y descripción actualizada`, id: this.lastID });
            }
          );
        });
    });
  } catch (err) {
    console.error("Error inesperado:", err);
    return res.status(500).json({ message: "Error inesperado", error: err.message });
  }
};

const cerrar = async (req, res) => {
  console.log('Datos recibidos en cerrar:', req.body);
  try {
    if (!req.body.idCochera) return res.status(400).json({ message: "Falta el valor de id" });
    if (!req.body.patente) return res.status(400).json({ message: "Falta el valor de patente" });
    if (!req.body.costo) return res.status(400).json({ message: "Falta el valor de costo" });

    // Función que devuelve una promesa para la consulta de estacionamiento
    const obtenerEstacionamientoActivo = (idCochera) => {
      return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM ${tabla} WHERE (eliminado IS NOT 1) AND (idCochera = ?) AND (horaEgreso IS NULL)`, idCochera, (error, row) => {
          if (error) return reject(error); // Rechaza la promesa si hay un error
          resolve(row); // Resuelve la promesa con la fila encontrada
        });
      });
    };

    // Buscar si hay un estacionamiento activo para la patente
    const row = await obtenerEstacionamientoActivo(req.body.idCochera);
    console.log('Estacionamiento encontrado:', row);

    if (!row) return res.status(403).json({ message: "La cochera actual no tiene un estacionamiento activo" });

    // Cerrar el estacionamiento actualizando la hora de egreso y el costo
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE ${tabla} SET horaEgreso = DATETIME('now', 'localtime'), costo = ? WHERE id = ?`,
        [req.body.costo, row.id],
        function (error) {
          if (error) return reject(error); // Rechaza la promesa si hay un error
          resolve(this.changes); // Resuelve la promesa con el número de cambios
        }
      );
    });

    // Actualizar el estado de la cochera a disponible
    await new Promise((resolve, reject) => {
      db.run(`UPDATE cochera SET deshabilitada = 0, descripcion = "Disponible" WHERE id = ?`, row.idCochera, (error) => {
        if (error) return reject(error); // Rechaza la promesa si hay un error
        resolve(); // Resuelve la promesa
      });
    });

    return res.json({ message: `Cochera para patente ${req.body.patente} cerrada con éxito` });
  } catch (error) {
    console.error("Error inesperado:", error);
    return res.status(500).json({ message: error.message }); // Enviar error como JSON
  }
};


const deleteAll = async (req, res) => {
  await db.run(`DELETE from ${tabla}`, function (error) {
    if (error) return res.status(500).send(error.message);
    return res.json({ message: "Todos los registros de estacionamiento han sido eliminados" });
  });
};

export const methods = {
  getAll,
  getById,
  getByIdCochera,
  abrir,
  cerrar,
  deleteAll
};
