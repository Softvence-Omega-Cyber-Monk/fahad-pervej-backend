import { Request, Response, NextFunction } from 'express';

export function normalizeParams(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // params
  for (const key in req.params) {
    const v = req.params[key];
    if (Array.isArray(v)) {
      req.params[key] = v[0];
    }
  }

  // query
  for (const key in req.query) {
    const v = req.query[key];
    if (Array.isArray(v)) {
      req.query[key] = v[0];
    }
  }

  next();
}
