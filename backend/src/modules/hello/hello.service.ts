import { AppError } from '../../lib/AppError.js'

export function getHelloMessage(name?: string): HelloMessage {
  if (name === 'error') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid name')
  }
  return { message: name ? `Hello, ${name}` : 'Hello from Express' }
}
