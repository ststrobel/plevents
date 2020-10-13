import * as express from 'express';
import { User } from '../models/user';
import { UserService } from '../services/user.service';
import { Tenant } from '../models/tenant';
import { Log } from '../models/log';
import { getConnection } from 'typeorm';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { TenantRelation } from '../models/tenant-relation';

export class UserController {
  public static register(app: express.Application): void {
    /*
     * update the active status of a user
     */
    app.put(
      '/secure/tenants/:tenantId/users/:userId/active/:active',
      tenantCorrelationHandler,
      async (req, res) => {
        // check if the user exists
        const user = (await User.findOne(req.params.userId)) as User;
        if (user) {
          // now check if the user tries to update himself - this is not allowed
          if (user.email === UserService.currentUser(req)) {
            res
              .status(409)
              .send({ error: 'It is not possible to update himself' });
          } else {
            // now check if the user to change belongs to the organization of the logged-in admin
            const relation = await TenantRelation.findOne({
              userId: user.id,
              tenantId: req.params.tenantId,
            });
            if (relation) {
              relation.active = req.params.active === 'true';
              relation.save();
              res.status(200).send(relation);
            } else {
              res.status(400).send({
                error: 'No relation found',
              });
            }
          }
        } else {
          res.status(404).send({ error: 'User not found' });
        }
      }
    );

    /*
     * delete a user - this can be triggered by the user himself OR another admin of the same tenant
     */
    app.delete(
      '/secure/tenants/:tenantId/users/:userId',
      tenantCorrelationHandler,
      async (req, res) => {
        // check if the user exists
        const user = (await User.findOne(req.params.id)) as User;
        if (user) {
          // now check if the user tries to delete himself
          if (user.email === UserService.currentUser(req)) {
            // this is only allowed if he/she is NOT the last admin of the tenant
            const usersOfTenantCount = await TenantRelation.count({
              tenantId: req.params.tenantId,
              active: true,
            });
            if (usersOfTenantCount === 1) {
              res.status(409).send({
                error:
                  'It is not possible to delete your account, as it is the last active within the tenant',
              });
            } else {
              TenantRelation.delete({
                tenantId: req.params.tenantId,
                userId: req.params.userId,
              });
              res
                .status(200)
                .send({ message: 'You removed yourself from the account' });
            }
          } else {
            // now check if the user to change belongs to the organization of the logged-in admin
            const relation = await TenantRelation.findOne({
              tenantId: req.params.tenantId,
              userId: req.params.userId,
            });
            if (relation) {
              relation.remove();
              res.status(200).send({ message: 'User removed from account' });
            } else {
              res.status(400).send({
                error: 'No relation found',
              });
            }
          }
        } else {
          res.status(404).send({ error: 'User not found' });
        }
      }
    );

    /*
     * register a new private user account
     */
    app.post('/profile', async (req, res) => {
      if ((await User.count({ where: { email: req.body.email } })) === 0) {
        // create the user
        await UserService.createUser(
          req.body.email,
          req.body.name,
          req.body.password
        );
      } else {
        // the user account already exists. do sth, like notify him by email
      }
      res.status(200).send({ message: 'User profile created' });
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
