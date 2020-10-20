import * as express from 'express';
import { User } from '../models/user';
import { UserService } from '../services/user.service';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { TenantRelation } from '../models/tenant-relation';
import { ROLE } from '../../../common/tenant-relation';
import { Verification, VerificationType } from '../models/verification';
import { Invitation } from '../models/invitation';
import { uniqBy } from 'lodash';
import { Tenant } from '../models/tenant';

export class UserController {
  public static register(app: express.Application): void {
    /*
     * update the active status of a user
     */
    app.put(
      '/secure/tenants/:tenantId/users/:userId/active/:active',
      tenantCorrelationHandler(),
      async (req, res) => {
        // check if the user exists
        const user = (await User.findOne(req.params.userId)) as User;
        if (user) {
          // now check if the user tries to update himself - this is not allowed
          if (user.email === UserService.username(req)) {
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
     * update the role of a user
     */
    app.put(
      '/secure/tenants/:tenantId/users/:userId/role/:roleName',
      tenantCorrelationHandler(ROLE.OWNER),
      async (req, res) => {
        // check if the user exists
        const user = (await User.findOne(req.params.userId)) as User;
        if (user) {
          // now check if the user tries to update himself - this is not allowed
          if (user.email === UserService.username(req)) {
            res
              .status(409)
              .send({ error: 'It is not possible to update yourself' });
          } else {
            // now check if the user to change belongs to the organization of the logged-in admin
            const relation = await TenantRelation.findOne({
              userId: user.id,
              tenantId: req.params.tenantId,
            });
            if (relation) {
              relation.role = req.params.roleName as ROLE;
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
      tenantCorrelationHandler(),
      async (req, res) => {
        // check if the user exists
        const user = (await User.findOne(req.params.id)) as User;
        if (user) {
          // now check if the user tries to delete himself
          if (user.email === UserService.username(req)) {
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
        const user = await UserService.createUserProfile(
          req.body.email,
          req.body.name,
          req.body.password
        );
        // check if a tenantPath is in the request. if so, request the belonging to this tenant
        if (user && req.body.tenantPath) {
          const tenant = await Tenant.findOne({
            where: { path: req.body.tenantPath },
          });
          if (tenant) {
            // only do sth if the tenant exists. if not, ignore the parameter
            const relation = new TenantRelation();
            relation.tenantId = tenant.id;
            relation.userId = user.id;
            relation.active = false;
            relation.role = ROLE.MEMBER;
            relation.save();
          }
        }
      } else {
        // the user account already exists. do sth, like notify him by email
      }
      res.status(200).send({ message: 'User profile created' });
    });

    /*
     * finish a user registration by confirming an account with a generated unique code
     */
    app.post('/profile/activate/:code', async (req, res) => {
      const verification = await Verification.findOneOrFail({
        code: req.params.code,
      });
      if (verification && verification.userId) {
        const user = await User.findOneOrFail(verification.userId);
        user.active = true;
        await user.save();
        Verification.delete({
          userId: user.id,
          type: VerificationType.REGISTRATION,
        });
        res.status(200).send({ message: 'User profile activated' });
      }
      res.status(400).send({ error: 'Code not found or invalid' });
    });

    /*
     * retrieve the profile of the logged-in user
     */
    app.get('/secure/profile', async (req, res) => {
      const user = await User.findOneOrFail({
        where: { email: UserService.username(req) },
      });
      res.status(200).send(user);
    });

    /*
     * update the profile of the logged-in user
     */
    app.put('/secure/profile', async (req, res) => {
      const user = await User.findOneOrFail({
        where: { email: UserService.username(req) },
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
        where: { email: UserService.username(req) },
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

    /*
     * delete the profile of the logged-in user
     */
    app.delete('/secure/profile', async (req, res) => {
      const user = await User.findOneOrFail({
        where: { email: UserService.username(req) },
      });
      await user.remove();
      res.status(200).send({ message: 'Profile deleted' });
    });

    /*
     * retrieve the current pending invitations for the current user
     */
    app.get('/secure/invitations', async (req, res) => {
      const invitations = await Invitation.find({
        where: { email: UserService.username(req) },
        relations: ['tenant'],
      });
      // now filter out all duplicate invitations for the same account
      res.status(200).send(uniqBy(invitations, 'tenantId'));
    });

    /*
     * decline the current pending invitation(s) of the current user for a specific tenant
     */
    app.delete('/secure/invitations/:tenantId', async (req, res) => {
      await Invitation.delete({
        tenantId: req.params.tenantId,
        email: UserService.username(req),
      });
      res.status(200).send({ message: 'Invitation declined' });
    });

    /*
     * accept the current pending invitation(s) of the current user for a specific tenant
     */
    app.post('/secure/invitations/:invitationId', async (req, res) => {
      const invitation = await Invitation.findOneOrFail(
        req.params.invitationId,
        { relations: ['tenant'] }
      );
      if (invitation.email === UserService.username(req)) {
        const user = await User.findOne({
          email: UserService.username(req),
        });
        const newRelation = new TenantRelation();
        newRelation.user = user;
        newRelation.tenant = invitation.tenant;
        newRelation.active = true;
        await newRelation.save();
        Invitation.delete({
          email: invitation.email,
          tenantId: invitation.tenantId,
        });
        res.status(200).send(newRelation);
      } else {
        res.status(400).send({ message: 'Invalid invitation' });
      }
    });
  }
}
