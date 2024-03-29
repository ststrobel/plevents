import 'reflect-metadata';
// equivalent of older: const express = require('express')
import express from 'express';
import { AuthController } from './controllers/auth.controller';
import { EventController } from './controllers/event.controller';
import { PdfController } from './controllers/pdf.controller';
import { CronService } from './cron.service';
import { TenantController } from './controllers/tenant.controller';
import { UserController } from './controllers/user.controller';
import { createConnection } from 'typeorm';
import { CategoryController } from './controllers/category.controller';
import headersHandler from './handlers/headers-handler';
import authenticationHandler from './handlers/authentication-handler';
import { PaymentController } from './controllers/payment.controller';
const bodyParser = require('body-parser');

// read configuration:
const dotenv = require('dotenv');
dotenv.config();

const app = express(); // Allow any method from any host and log requests

app.use(headersHandler);
app.use((req, res, next) => {
  // the stripe webhook requires to receive raw body!
  if (req.originalUrl === '/psp/webhook') {
    next();
  } else {
    // Use JSON parser for all non-webhook routes
    bodyParser.json()(req, res, next);
  }
});

app.use(authenticationHandler);

TenantController.register(app);
AuthController.register(app);
EventController.register(app);
PdfController.register(app);
UserController.register(app);
CategoryController.register(app);
PaymentController.register(app);

// connect to the database:
createConnection()
  .then(() => {
    console.log('\x1b[32mDatabase connection established\x1b[0m');
    // start our server on port 4201
    app.listen(
      parseInt(process.env.HTTP_PORT),
      process.env.HTTP_HOSTNAME,
      async function () {
        console.log(
          '\x1b[32mServer now listening on ' + process.env.HTTP_PORT + '\x1b[0m'
        );
        const cronService = new CronService();
        cronService.removeParticipantsData();
        cronService.checkTenantLicenses();
      }
    );
  })
  .catch(e => {
    console.log('\x1b[31m' + e + '\x1b[0m');
  });
