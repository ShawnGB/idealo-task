import type { Request, Response } from 'express'
import { getHelloMessage } from './hello.service.js'

export function getHello(req: Request, res: Response): void {
  const name = typeof req.query.name === 'string' ? req.query.name : undefined
  res.json(getHelloMessage(name))
}
