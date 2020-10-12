import * as express from 'express';
import { Email } from '../models/email';
import { User } from '../models/user';
import { UserService } from '../services/user.service';
import { Tenant } from '../models/tenant';
import { Log } from '../models/log';
import { getConnection } from 'typeorm';

export class UserController {
  public static register(app: express.Application): void {
    /*
     * update the active status of a user
     */
    app.put('/secure/users/:id/active/:active', async (req, res) => {
      // check if the user exists
      const user = (await User.findOne(req.params.id)) as User;
      if (user) {
        // now check if the user tries to update himself - this is not allowed
        if (user.email === UserService.currentUser(req)) {
          res
            .status(409)
            .send({ error: 'It is not possible to update himself' });
        } else {
          // now check if the user to change belongs to the organization of the logged-in admin
          if (user.tenant.id === (await UserService.currentTenant(req)).id) {
            user.active = req.params.active === 'true';
            user.save();
            res.status(200).send(user);
          } else {
            res.status(403).send({
              error:
                'You are not permitted to update users of a different organization',
            });
          }
        }
      } else {
        res.status(404).send({ error: 'User not found' });
      }
    });

    /*
     * delete a user - this can be triggered by the user himself OR another admin of the same tenant
     */
    app.delete('/secure/users/:id', async (req, res) => {
      // check if the user exists
      const user = (await User.findOne(req.params.id)) as User;
      if (user) {
        // now check if the user tries to delete himself
        if (user.email === UserService.currentUser(req)) {
          // this is only allowed if he/she is NOT the last admin of the tenant
          const usersOfTenant = (await User.find({
            where: { tenant: user.tenant },
          })) as User[];
          if (usersOfTenant.length === 1) {
            res.status(409).send({
              error:
                'It is not possible to delete your account, as it is the last within the tenant',
            });
          } else {
            getConnection()
              .createQueryBuilder()
              .delete()
              .from(User)
              .where(`id = '${user.id}'`)
              .execute();
            res.status(200).send({ message: 'Account deleted' });
          }
        } else {
          // now check if the user to change belongs to the organization of the logged-in admin
          const tenant = (await UserService.currentTenant(req)) as Tenant;
          if (user.tenant === tenant) {
            getConnection()
              .createQueryBuilder()
              .delete()
              .from(User)
              .where(`id = '${user.id}'`)
              .execute();
            const logMessage = `Nutzer ${user.id} (${user.email}) gelöscht`;
            Log.write(tenant.id, UserService.currentUser(req), logMessage);
            res.status(200).send({ message: 'Account deleted' });
          } else {
            res.status(403).send({
              error:
                'You are not permitted to update users of a different organization',
            });
          }
        }
      } else {
        res.status(404).send({ error: 'User not found' });
      }
    });

    /*
     * retrieve the profile of the logged-in user
     */
    app.get('/secure/profile', async (req, res) => {
      const user = await User.findOneOrFail({
        where: { email: UserService.currentUser(req) },
      });
      res.status(200).send(user);
    });

    /*
     * update the profile of the logged-in user
     */
    app.put('/secure/profile', async (req, res) => {
      const user = await User.findOneOrFail({
        where: { email: UserService.currentUser(req) },
      });
      // now update the eligible values with the values from the payload:
      user.name = req.body.name;
      await user.save();
      res.status(200).send(user);
    });

    /*
     * update the password of the logged-in user
     */
    app.put('/secure/profile/password', async (req, res) => {
      const user = await User.findOneOrFail({
        where: { email: UserService.currentUser(req) },
      });
      // check if the old password from the payload is correct
      if (
        await UserService.checkCredentials(user.email, req.body.oldPassword)
      ) {
        user.password = req.body.newPassword;
        await user.save();
        res.status(200).send({ message: 'Password updated' });
      } else {
        res.status(400).send({ error: 'Old password incorrect' });
      }
    });
  }
}
