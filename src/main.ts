import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for your React app
  app.enableCors({
    origin: ['http://localhost:5173', 'https://admin-pharmacy-orpin.vercel.app'], // your Vite React app URLs
    credentials: true, 
    exposedHeaders: ['Content-Disposition'], // ADD THIS for file downloads              // if you're using cookies or auth headers
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
