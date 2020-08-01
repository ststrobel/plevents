import * as express from 'express';
import { Email } from '../models/email';

export class EmailController {
  public static register(app: express.Application): void {
    app.get('/secure/emails', async (req, res) => {
      res.send(await Email.findAll());
    });

    app.delete('/secure/emails/:id', async (req, res) => {
      await Email.destroy({
        where: {
          id: req.params.id,
        },
      });
      res.status(200).send({ message: 'Email deleted' });
    });

    app.post('/secure/emails', async (req, res) => {
      const email = await Email.findOrCreate({
        where: { address: req.body.mail },
      });
      console.log('email ' + req.body.mail + ' added (or was existing already)');
      res.status(200).send(email[0]);
    });
  }
}
