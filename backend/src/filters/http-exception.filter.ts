import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

const statusToCode: Record<number, ApiErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  404: 'NOT_FOUND',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();
    const error: ApiError = {
      message: resolveMessage(exception),
      code: statusToCode[statusCode] ?? 'INTERNAL_ERROR',
      statusCode,
    };
    response.status(statusCode).json(error);
  }
}

function resolveMessage(exception: HttpException): string {
  const raw = exception.getResponse();
  if (typeof raw !== 'object' || raw === null) return exception.message;
  const msg = (raw as Record<string, unknown>).message;
  return Array.isArray(msg) ? (msg as string[]).join('; ') : exception.message;
}
