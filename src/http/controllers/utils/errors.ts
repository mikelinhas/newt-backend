
import { Response } from 'express'

export function errorHandler(error: any, res: Response) {
  console.error(error)
  res.status(500).send(error)
}