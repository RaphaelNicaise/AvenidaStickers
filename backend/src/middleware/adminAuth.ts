import { Request, Response, NextFunction } from 'express';

interface AdminRequest extends Request {
  isAdmin?: boolean;
}

export const adminAuth = (req: AdminRequest, res: Response, next: NextFunction): void => {
  const { authorization } = req.headers;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    res.status(500).json({
      success: false,
      message: 'Configuración de admin no disponible'
    });
    return;
  }

  if (!authorization) {
    res.status(401).json({
      success: false,
      message: 'Token de autorización requerido'
    });
    return;
  }

  const token = authorization.replace('Bearer ', '');

  if (token !== adminKey) {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado'
    });
    return;
  }

  req.isAdmin = true;
  next();
};