import { UserService } from '../services/user.service';
import * as express from 'express';
import { UserI } from '../../../common/user';
import { Log } from '../models/log';

export class AuthController {
  public static register(app: express.Application): void {
    app.post('/createUser', (request, response) => {
      if (request.get('CVJM-Security') === 'ABCD1234') {
        try {
          const newUserData = <UserI>request.body;
          UserService.createUser(newUserData.username, newUserData.password);
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
      let authRequest = null;
      try {
        authRequest = <UserI>request.body;
        if (await UserService.checkCredentials(authRequest.username, authRequest.password)) {
          const logMessage = `Erfolgreicher Login`;
          Log.build({ user: authRequest.username, message: logMessage }).save();
          response.status(200).send({ username: authRequest.username });
        } else {
          let username = '"unbekannter Benutzer"';
          if (authRequest.username) {
            username = authRequest.username;
          }
          console.log('\x1b[33mAnmeldung fehlgeschlagen für ' + username + '\x1b[0m');
          response.status(401).send({ message: 'Nutzername oder Passwort falsch' });
        }
      } catch (e) {
        console.log('\x1b[31mTechnischer Fehler beim Login\x1b[0m', e);
        response.status(401).send({ message: 'Technischer Fehler beim Login' });
      }
    });
  }
}
