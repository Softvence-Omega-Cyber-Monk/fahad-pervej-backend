import { Request } from 'express';

export function getParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value !== 'string') {
    throw new Error(`Invalid param: ${key}`);
  }

  return value;
}
