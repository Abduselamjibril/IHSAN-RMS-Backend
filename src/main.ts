import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { verifyToken, hashToken } from './modules/security/utils/security.crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure conservative size limits (10MB) instead of Infinity to prevent denial of service
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Global request DTO validation and sanitization
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Serve static uploaded files under authorization check for sensitive subdirectories
  app.use('/uploads', async (req: any, res: any, next: any) => {
    if (req.method === 'OPTIONS') {
      return next();
    }

    const urlPath = req.path;
    const isSensitive = urlPath.startsWith('/contracts') || 
                        urlPath.startsWith('/documents') || 
                        urlPath.startsWith('/floorplans');

    if (!isSensitive) {
      return next();
    }

    try {
      let token = '';
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      } else if (req.query && req.query.token) {
        token = req.query.token as string;
      } else if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc: any, c: string) => {
          const parts = c.trim().split('=');
          if (parts.length >= 2) {
            acc[parts[0]] = parts.slice(1).join('=');
          }
          return acc;
        }, {});
        token = cookies['auth_token'];
      }

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized access to document.' });
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: 'Invalid or expired document token.' });
      }

      const dataSource = app.get(DataSource);
      const activeSession = await dataSource.query(
        `SELECT 1 FROM rems_user_session
         WHERE sessiontoken = $1 AND userid = $2 AND isactive = true
         LIMIT 1`,
        [hashToken(token), decoded.userId]
      );

      if (!activeSession.length) {
        return res.status(401).json({ message: 'Your login session is no longer active.' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized document access.' });
    }
  });

  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  }));

  // Allow Angular dev server at :4200 to call this API
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:56050', 'http://localhost:62159'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    // Swagger Configuration
    const config = new DocumentBuilder()
      .setTitle('IHSAN REMS API')
      .setDescription('Real Estate Management System (REMS) API for IHSAN Properties and Business Service PLC')
      .setVersion('1.0')
      .addTag('Properties', 'Property & Inventory Management Module')
      .addTag('CRM', 'Customer Relationship Management Module')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`📖 Swagger API Docs available at http://localhost:${process.env.PORT ?? 3000}/api/docs`);
  }
  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 IHSAN REMS API running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
// Triggering rebuild after database clear

