import jwt from 'jsonwebtoken'
import { NextFunction, Request, Response } from "express"


const SECRET = process.env.SECRET as string

export function invalidateToken(req: Request, res: Response) {
  res.status(200).send('sure, whateva...')
}

export function checkToken(req: Request, res: Response, next: NextFunction) {
  next()
}

export async function loginToken(req: Request, res: Response) {
  try {
    const token = jwt.sign({ user: "TODO" }, SECRET, {
      expiresIn: '360d', // expires in 360d
    })
    res.status(200).json({
      message: 'Authentication successful!',
      token,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({})
  }
}
