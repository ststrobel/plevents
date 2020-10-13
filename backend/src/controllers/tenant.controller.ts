import * as express from 'express';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';
import { Tenant } from '../models/tenant';
import { UserI } from '../../../common/user';
import { User } from '../models/user';
import { TenantI } from '../../../common/tenant';
import { getConnection } from 'typeorm';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { TenantRelation } from '../models/tenant-relation';
import { map } from 'lodash';

export class TenantController {
  public static register(app: express.Application): void {
    /*
     * create a new tenant. this is a public endpoint, anyone can create one
     */
    app.post('/tenants', async (req, res) => {
      const tenantToCreate = <TenantI>req.body;
      let tenant = await Tenant.findOne({
        path: tenantToCreate.path,
      });
      if (!tenant) {
        tenant = new Tenant();
        tenant.name = tenantToCreate.name;
        tenant.path = tenantToCreate.path;
        tenant.consentTeaser1 = req.body.consentTeaser1;
        tenant.consentText1 = req.body.consentText1;
        tenant.consentTeaser2 = req.body.consentTeaser2;
        tenant.consentText2 = req.body.consentText2;
        tenant.color = req.body.color;
        await tenant.save();
        // check if there is an auth header present. if so, it means that an existing user was creating a new organisation. therefore directly assign him as an active admin
        const user = await User.findOne({
          where: { email: UserService.currentUser(req) },
        });
        if (user) {
          const relation = new TenantRelation();
          relation.user = user;
          relation.tenant = tenant;
          relation.active = true;
          relation.save();
          Log.write(tenant.id, user.id, `Tenant ${tenant.id} erstellt`);
        } else {
          Log.write(tenant.id, null, `Tenant ${tenant.id} erstellt`);
        }
        res.status(200).send(tenant);
      } else {
        res.status(404).send({ error: 'Tenant already exists' });
      }
    });

    /*
     * get all tenants for the currently logged-in user
     */
    app.get('/secure/tenants', async (req, res) => {
      const user = await User.findOneOrFail({
        email: UserService.currentUser(req),
      });
      const tenantRelations = await TenantRelation.find({
        where: { user },
        relations: ['tenant'],
      });
      res.status(200).send(tenantRelations);
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
      tenantCorrelationHandler,
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
      tenantCorrelationHandler,
      async (request, res) => {
        // first, check if the client is connected to the tenant he/she wants to delete:
        const currentUser = await User.findOne({
          email: UserService.currentUser(request),
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
      tenantCorrelationHandler,
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
          // if the user exists, simply add him to the tenant. if not, invite him by email:
          if (existingUser) {
            // attach user directly
            const relation = new TenantRelation();
            relation.user = existingUser;
            relation.tenantId = request.params.tenantId;
            relation.active = true;
            relation.save();
            response.status(200).send({ message: 'User added to account' });
          } else {
            // send invitation email
            // TODO
          }
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
      tenantCorrelationHandler,
      async (request, response) => {
        const tenantRelations = await TenantRelation.find({
          where: { tenantId: request.params.tenantId },
          relations: ['user'],
        });
        response.status(200).send(tenantRelations);
      }
    );
  }
}
