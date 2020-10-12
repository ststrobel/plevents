import { UserService } from '../services/user.service';
import * as express from 'express';
import { UserI } from '../../../common/user';
import { Log } from '../models/log';
import { userInfo } from 'os';
import { User } from '../models/user';

export class AuthController {
  public static register(app: express.Application): void {
    app.post('/createUser', async (request, response) => {
      if (
        request.get(process.env.SECURITY_HEADER) === process.env.SECURITY_TOKEN
      ) {
        try {
          const newUserData = <UserI>request.body;
          await UserService.createUser(
            newUserData.tenantId,
            newUserData.email,
            newUserData.name,
            newUserData.password
          );
          response.sendStatus(200);
        } catch (e) {
          console.log(e);
          response.sendStatus(400);
        }
      } else {
        response.sendStatus(401);
      }
    });

    app.post('/authenticate', async (request, response) => {
      try {
        const authRequest = <UserI>request.body;
        if (
          await UserService.checkCredentials(
            authRequest.email,
            authRequest.password
          )
        ) {
          const user = await User.findOne(
            { email: authRequest.email },
            { relations: ['tenant'] }
          );
          Log.write(user.tenant.id, user.id, `Erfolgreicher Login`);
          response.status(200).send(user);
        } else {
          let email = '"unbekannter Benutzer"';
          if (authRequest.email) {
            email = authRequest.email;
          }
          console.log(
            '\x1b[33mAnmeldung fehlgeschlagen für ' + email + '\x1b[0m'
          );
          response
            .status(401)
            .send({ error: 'Nutzername oder Passwort falsch' });
        }
      } catch (e) {
        console.log('\x1b[31mTechnischer Fehler beim Login\x1b[0m', e);
        response.status(401).send({ error: 'Technischer Fehler beim Login' });
      }
    });
  }
}
