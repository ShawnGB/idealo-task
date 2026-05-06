import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/AppError.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiError = {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    }
    res.status(err.statusCode).json(body)
    return
  }

  console.error(err)
  const body: ApiError = {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong',
  }
  res.status(500).json(body)
}
