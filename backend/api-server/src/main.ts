import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { logger } from "./lib/logger";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS with production-ready security hardening.
  // Parse the allowed origins from the CORS_ALLOWED_ORIGINS environment variable.
  const allowedOriginsEnv = process.env["CORS_ALLOWED_ORIGINS"];
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(",").map((o) => o.trim())
    : ["http://localhost:8081"]; // Default to Expo Metro web server port if not specified

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, origin?: any) => void) => {
      // 1. Allow requests with no origin (e.g., mobile native apps, curl, or server-to-server calls)
      if (!origin) {
        callback(null, true);
        return;
      }

      // 2. Check if the origin matches the configured whitelist
      const isWhitelisted = allowedOrigins.includes(origin);

      // 3. In non-production environments, dynamically allow any localhost origin to ease development
      const isLocalDev = process.env["NODE_ENV"] !== "production" && origin.startsWith("http://localhost:");

      if (isWhitelisted || isLocalDev) {
        callback(null, true);
      } else {
        // To fail the CORS check, we pass `false` as the second argument.
        // This instructs the middleware to omit the `Access-Control-Allow-Origin` header,
        // which forces the browser to block the response without producing an unnecessary
        // 500 Internal Server Error on our backend.
        callback(null, false);
      }
    },
    // Explicitly define the HTTP methods we permit cross-origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    // Allow credentials (such as authentication headers, cookies, etc.) to be exposed cross-origin
    credentials: true,
  });

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
