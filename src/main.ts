import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Allow Angular dev server at :4200 to call this API
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('IHSAN REMS API')
    .setDescription('Real Estate Management System (REMS) API documentation')
    .setVersion('1.0')
    .addTag('Properties', 'Property & Inventory Management Module')
    .addTag('CRM', 'Customer Relationship Management Module')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 IHSAN REMS API running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📖 Swagger API Docs available at http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
