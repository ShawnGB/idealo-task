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

    const rawResponse = exception.getResponse();
    const responseMessage =
      typeof rawResponse === 'object' && rawResponse !== null
        ? (rawResponse as Record<string, unknown>).message
        : undefined;
    const message = Array.isArray(responseMessage)
      ? (responseMessage as string[]).join('; ')
      : exception.message;

    const error: ApiError = {
      message,
      code: statusToCode[statusCode] ?? 'INTERNAL_ERROR',
      statusCode,
    };

    response.status(statusCode).json(error);
  }
}
