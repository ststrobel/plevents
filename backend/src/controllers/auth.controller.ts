import { UserService } from '../services/user.service';
import * as express from 'express';
import { UserI } from '../../../common/user';
import { Log } from '../models/log';
import { User } from '../models/user';

export class AuthController {
  public static register(app: express.Application): void {
    app.post('/authenticate', async (request, response) => {
      try {
        const authRequest = <UserI>request.body;
        const user = await User.findOne({ email: authRequest.email });
        if (
          await UserService.checkCredentials(
            authRequest.email,
            authRequest.password
          )
        ) {
          Log.write(null, user.id, `Erfolgreicher Login`);
          response.status(200).send(user);
        } else {
          response
            .status(401)
            .send({ error: 'Wrong credentials or account not active' });
        }
      } catch (e) {
        response.status(401).send({ error: 'Technical error' });
      }
    });
  }
}
