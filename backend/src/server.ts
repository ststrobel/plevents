// equivalent of older: const express = require('express')
import express from 'express';
import { DBConnection } from './db.connection';
import { AuthController } from './controllers/auth.controller';
import { UserService } from './services/user.service';
import { EmailController } from './controllers/email.controller';
import { EventController } from './controllers/event.controller';
import { PdfController } from './controllers/pdf.controller';
import { CronService } from './cron.service';
import { TenantController } from './controllers/tenant.controller';
import { UserController } from './controllers/user.controller';

// read configuration:
const dotenv = require('dotenv');
dotenv.config();

const app = express(); // Allow any method from any host and log requests

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    `Origin, X-Requested-With, Content-Type, Accept, Authorization, ${process.env.SECURITY_HEADER}`
  );
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});
// Handle POST requests that come in formatted as JSON
app.use(express.json());

app.use(async (req, res, next) => {
  if (req.path.startsWith('/secure')) {
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      if (await UserService.checkCredentials(username, password)) {
        // authentication was successful
        next();
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(401);
    }
  } else {
    // no authentication needed
    next();
  }
});

TenantController.register(app);
AuthController.register(app);
EmailController.register(app);
EventController.register(app);
PdfController.register(app);
UserController.register(app);

// start our server on port 4201
app.listen(parseInt(process.env.HTTP_PORT), process.env.HTTP_HOSTNAME, async function () {
  console.log('\x1b[32mServer now listening on ' + process.env.HTTP_PORT + '\x1b[0m');
  DBConnection.init();
  const cronService = new CronService();
  cronService.removeParticipantsData();
});
