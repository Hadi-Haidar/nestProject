import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Update CORS to include your Vercel domain
  app.enableCors({
    origin: [
      'http://localhost:5173',           // Local development
      'https://midicine.vercel.app',     // Your Vercel production
      'https://*.vercel.app'              // All Vercel preview deployments
    ],
    credentials: true,
  });
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Application is running on port: ${port}`);
}
bootstrap();