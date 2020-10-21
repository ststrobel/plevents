import { UserService } from '../services/user.service';
import * as express from 'express';
import { UserI } from '../../../common/user';
import { Log } from '../models/log';
import { User } from '../models/user';
import { Verification, VerificationType } from '../models/verification';
import { EmailService, EMAIL_TEMPLATES } from '../services/email-service';
import { ROUTES } from '../../../common/frontend.routes';

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

    app.post('/forgotten-password', async (request, response) => {
      try {
        const email = request.body.email;
        const user = await User.findOneOrFail({ email });
        if (user) {
          const verification = new Verification();
          verification.type = VerificationType.PASSWORD_RESET;
          verification.userId = user.id;
          await verification.save();
          const resetlink = `${process.env.DOMAIN}/${ROUTES.PASSWORD_RESET}passwort-reset?code=${verification.code}`;
          EmailService.get().send(EMAIL_TEMPLATES.PASSWORD_RESET, user.email, {
            name: user.name,
            resetlink,
          });
          response
            .status(200)
            .send({ message: 'Password reset process initiated' });
        }
      } catch (e) {
        response.status(500).send({ error: 'Technical error' });
      }
    });

    app.post('/forgotten-password/:code', async (request, response) => {
      try {
        const verification = await Verification.findOne({
          code: request.params.code,
        });
        if (verification) {
          const user = await User.findOneOrFail(verification.userId);
          user.password = request.body.password;
          await user.save();
          Verification.delete({
            userId: user.id,
            type: VerificationType.PASSWORD_RESET,
          });
          response.status(200).send({ message: 'Password set' });
        } else {
          response.status(400).send({ error: 'Code not found or expired' });
        }
      } catch (e) {
        response.status(500).send({ error: 'Technical error' });
      }
    });
  }
}
