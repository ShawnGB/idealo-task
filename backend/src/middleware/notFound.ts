import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/AppError.js'

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, 'NOT_FOUND', 'Not found'))
}
