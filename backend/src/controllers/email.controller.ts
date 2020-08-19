import * as express from 'express';
import { Email } from '../models/email';
import { getConnection } from 'typeorm';

export class EmailController {
  public static register(app: express.Application): void {
    app.get('/secure/emails', async (req, res) => {
      res.send(await Email.find());
    });

    app.delete('/secure/emails/:id', async (req, res) => {
      getConnection()
        .createQueryBuilder()
        .delete()
        .from(Email)
        .where(`id = ${req.params.id}`)
        .execute();
      res.status(200).send({ message: 'Email deleted' });
    });

    app.post('/secure/emails', async (req, res) => {
      const email = new Email();
      email.address = req.body.mail;
      email.save();
      res.status(200).send(email);
    });
  }
}
