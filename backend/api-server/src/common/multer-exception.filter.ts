import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { MulterError } from "multer";
import type { Request, Response } from "express";
import * as fs from "node:fs";

/**
 * Turns multer's limit errors into useful HTTP responses.
 *
 * Nest does not know MulterError, so an oversized upload would otherwise
 * surface as a bare 500 "Internal server error" and the client could not tell
 * the difference between "your file is too big" and "the server broke".
 *
 * It also deletes whatever multer already streamed to disk. diskStorage writes
 * as it reads, so a rejected upload can leave a partial file behind — which
 * would make the size limit easy to defeat by repeatedly sending oversized
 * files and abandoning the fragments.
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(error: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { file?: { path?: string } }>();
    const response = ctx.getResponse<Response>();

    const partialPath = request.file?.path;
    if (partialPath) {
      try {
        fs.unlinkSync(partialPath);
      } catch {
        /* already gone, or never written */
      }
    }

    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    const status = tooLarge ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      error: tooLarge ? "Payload Too Large" : "Bad Request",
      message: tooLarge ? "File is too large" : `Upload rejected: ${error.code}`,
    });
  }
}
