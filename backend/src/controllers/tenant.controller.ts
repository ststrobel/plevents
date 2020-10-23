import * as express from 'express';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';
import { Tenant } from '../models/tenant';
import { User } from '../models/user';
import { TenantI } from '../../../common/tenant';
import { getConnection } from 'typeorm';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { TenantRelation } from '../models/tenant-relation';
import { Invitation } from '../models/invitation';
import { EmailService, EMAIL_TEMPLATES } from '../services/email-service';
import { uniqBy } from 'lodash';
import { TenantService } from '../services/tenant.service';
import { ROUTES } from '../../../common/frontend.routes';

export class TenantController {
  public static register(app: express.Application): void {
    /*
     * create a new tenant. this is a public endpoint, anyone can create one
     */
    app.post('/secure/tenants', async (req, res) => {
      const tenantToCreate = <TenantI>req.body;
      // sanity check - make sure the user did not try to take a reserved name
      // TODO
      let tenant = await Tenant.findOne({
        path: tenantToCreate.path,
      });
      if (!tenant) {
        // an existing user was creating a new organisation. therefore directly assign him as an active admin
        const owner = await User.findOneOrFail({
          where: { email: UserService.username(req) },
        });
        res
          .status(200)
          .send(
            await TenantService.get().createNewTenant(tenantToCreate, owner)
          );
      } else {
        res.status(400).send({ error: 'Tenant already exists' });
      }
    });

    /*
     * get all tenants including relations for the currently logged-in user
     */
    app.get('/secure/tenants', async (req, res) => {
      res
        .status(200)
        .send(
          await TenantService.get().getRelationsByUser(
            (await UserService.currentUser(req)).id
          )
        );
    });

    /*
     * retrieve a tenant based on its id
     */
    app.get('/secure/tenants/:id', async (req, res) => {
      const tenant = await Tenant.findOne(req.params.id);
      if (tenant) {
        res.status(200).send(tenant);
      } else {
        res.status(404).send({ error: 'Tenant not existing' });
      }
    });

    /*
     * retrieve a tenant based on its path name
     */
    app.get('/tenants/:path', async (req, res) => {
      const tenant = await Tenant.findOne({
        path: req.params.path,
      });
      if (tenant) {
        res.status(200).send(tenant);
      } else {
        res.status(404).send({ error: 'Tenant not existing' });
      }
    });

    /*
     * update a tenant
     */
    app.put(
      '/secure/tenants/:tenantId',
      tenantCorrelationHandler(),
      async (req, res) => {
        const tenant = await Tenant.findOneOrFail(req.params.tenantId);
        tenant.name = req.body.name;
        tenant.path = req.body.path;
        tenant.logo = req.body.logo;
        tenant.consentTeaser1 = req.body.consentTeaser1;
        tenant.consentText1 = req.body.consentText1;
        tenant.consentTeaser2 = req.body.consentTeaser2;
        tenant.consentText2 = req.body.consentText2;
        tenant.color = req.body.color;
        try {
          await tenant.save();
          res.status(200).send(tenant);
        } catch (e) {
          res.status(500).send({ error: 'Error saving tenant' });
        }
      }
    );

    /*
     * delete the tenant, including all its users and events (including their participants)
     */
    app.delete(
      '/secure/tenants/:tenantId',
      tenantCorrelationHandler(),
      async (request, res) => {
        // first, check if the client is connected to the tenant he/she wants to delete:
        const currentUser = await User.findOne({
          email: UserService.username(request),
        });
        getConnection()
          .createQueryBuilder()
          .delete()
          .from(Tenant)
          .where(`id = '${request.params.tenantId}'`)
          .execute();
        Log.write(
          request.params.tenantId,
          currentUser.id,
          `Tenant ${request.params.tenantId} gelöscht`
        );
        res.status(200).send({ message: 'Tenant deleted' });
      }
    );

    /*
     * add a new user to the tenant using an email address
     */
    app.post(
      '/secure/tenants/:tenantId/users',
      tenantCorrelationHandler(),
      async (request, response) => {
        const existingUser = await User.findOne({
          where: { email: request.body.email },
        });
        if (
          !existingUser ||
          (existingUser &&
            (await TenantRelation.count({
              where: { tenantId: request.params.tenantId, user: existingUser },
            })) === 0)
        ) {
          // send invitation email
          const tenant = await Tenant.findOneOrFail(request.params.tenantId);
          const invitation = new Invitation();
          invitation.email = request.body.email;
          invitation.tenantId = request.params.tenantId;
          await invitation.save();
          const link = `${process.env.DOMAIN}/${ROUTES.MY_TENANTS}`;
          EmailService.get().send(
            EMAIL_TEMPLATES.JOIN_TENANT,
            request.body.email,
            { tenant: tenant.name, link }
          );
          response.status(200).send(invitation);
        } else {
          response
            .status(409)
            .send({ error: 'User already attached to this acount' });
        }
      }
    );

    /*
     * retrieve all users for a given tenant
     */
    app.get(
      '/secure/tenants/:tenantId/users',
      tenantCorrelationHandler(),
      async (request, response) => {
        const tenantRelations = await TenantRelation.find({
          where: { tenantId: request.params.tenantId },
          relations: ['user'],
        });
        response.status(200).send(tenantRelations);
      }
    );

    /*
     * retrieve all open invitations for users specific for a client
     */
    app.get(
      '/secure/tenants/:tenantId/invitations',
      tenantCorrelationHandler(),
      async (req, res) => {
        const invitations = await Invitation.find({
          where: { tenantId: req.params.tenantId },
        });
        // now filter out all duplicate invitations for the same account
        res.status(200).send(uniqBy(invitations, 'tenantId'));
      }
    );

    /*
     * revoke all open invitations for a user for a tenant
     */
    app.delete(
      '/secure/tenants/:tenantId/invitations/:invitationId',
      tenantCorrelationHandler(),
      async (req, res) => {
        const invitation = await Invitation.findOneOrFail(
          req.params.invitationId
        );
        if (invitation.tenantId === req.params.tenantId) {
          await Invitation.delete({
            tenantId: invitation.tenantId,
            email: invitation.email,
          });
          res.status(200).send({ message: 'Invitation revoked' });
        } else {
          res.status(400).send({ error: 'Invitation invalid for tenant' });
        }
      }
    );
  }
}
