import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw errors for extra properties
    }),
  );

  // ✅ Enable CORS for your React app and mobile apps
  app.enableCors({
    origin: true, // Allow all origins (for mobile apps with dynamic IPs)
    credentials: true, 
    exposedHeaders: ['Content-Disposition'], // ADD THIS for file downloads              // if you're using cookies or auth headers
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
