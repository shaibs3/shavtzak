import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Shabtzaq API')
    .setDescription('Military deployment scheduler API')
    .setVersion('1.0')
    .addTag('soldiers', 'Soldier management')
    .addTag('tasks', 'Task management')
    .addTag('shifts', 'Shift scheduling')
    .addTag('leave', 'Leave management')
    .addTag('deployment', 'Deployment configuration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger API docs available at: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
