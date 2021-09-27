import { Request, Response, NextFunction } from 'express'
import BaseError from '../errors/BaseError'
import Logger from '../lib/logger'

export default function errorHandler (error: BaseError, req: Request, res: Response, next: NextFunction): void {
  const status = error.status || 500
  const message = error.message || 'Something went wrong '

  Logger.error('Error Message:', { message })
  Logger.error('Error Status Code', { statusCode: status })

  res.send({
    message
  })
}