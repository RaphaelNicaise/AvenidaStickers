import { Request, Response, NextFunction } from 'express';

interface AdminRequest extends Request {
  isAdmin?: boolean;
}

// Middleware opcional para admin - no bloquea si no hay token
export const optionalAdminAuth = (req: AdminRequest, res: Response, next: NextFunction): void => {
  const { authorization } = req.headers;
  const adminKey = process.env.ADMIN_KEY;

  if (authorization && adminKey) {
    const token = authorization.replace('Bearer ', '');
    if (token === adminKey) {
      req.isAdmin = true;
    }
  }

  next();
};