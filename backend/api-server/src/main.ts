import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { logger } from "./lib/logger";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Register Helmet middleware globally to secure Express HTTP headers.
  // Since this backend is a pure API server, we disable Helmet's UI-oriented CSP defaults
  // and set a strict Content Security Policy (CSP) of 'default-src none' to prevent
  // the browser from executing any scripts or loading any resources from this origin.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
        },
      },
    })
  );

  // Use global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Set global prefix
  app.setGlobalPrefix("api");

  const rawPort = process.env["PORT"];
  if (!rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  await app.listen(port);
  logger.info({ port }, "NestJS Server listening");
}

bootstrap().catch((err) => {
  logger.error({ err }, "Error starting NestJS Server");
  process.exit(1);
});
