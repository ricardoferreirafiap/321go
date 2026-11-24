import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('EXCEPTION');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erro interno do servidor';

    const responseBody = {
      statusCode: status,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      code:
        typeof message === 'object' && message && 'code' in (message as Record<string, unknown>)
          ? (message as Record<string, unknown>).code
          : undefined,
      error: typeof message === 'string' ? message : (message as any)?.message || message,
    };

    this.logger.error(
      `[${req.method}] ${req.originalUrl} - ${status} - ${JSON.stringify(responseBody)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    res.status(status).json(responseBody);
  }
}

