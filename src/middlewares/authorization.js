import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

function soloAdmin(req, res, next) {
  delete req.body.username;
  delete req.body.esAdmin;
  const user = buscarDatosUsuarios(req);
  if (user && user.username && user.esAdmin) { 
    req.body.username = user.username;
    req.body.esAdmin = user.esAdmin;
    return next();
  }
  return res.sendStatus(401);
}

function soloPrivate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Extraer el token de Authorization
  if (!token) return res.sendStatus(401);

  try {
    const user = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    req.user = user; // Agregar usuario decodificado al objeto de solicitud
    next();
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.sendStatus(401);
  }
}


function buscarDatosUsuarios(req) {
  try {
    // Obtiene el token desde las cookies o desde el header
    const cookieJWT = req.headers.cookie
      ?.split("; ")
      .find(cookie => cookie.startsWith("jwt="))
      ?.slice(4);
    const headerJWT = req.headers.authorization?.slice(7);
    const token = cookieJWT || headerJWT;

    // Verifica que el token exista
    if (!token) return null;

    // Decodifica el token
    const decodificada = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    return { username: decodificada.username, esAdmin: decodificada.esAdmin };
  } catch (error) {
    console.error("Error al verificar el token:", error.message);
    return null; // Devuelve null si el token no es válido
  }
}

export const methods = {
  soloAdmin,
  soloPrivate,
};
