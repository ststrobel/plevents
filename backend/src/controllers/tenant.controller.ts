import * as express from 'express';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';
import { Tenant } from '../models/tenant';
import { UserI } from '../../../common/user';
import { User } from '../models/user';
import { TenantI } from '../../../common/tenant';

export class TenantController {
  public static register(app: express.Application): void {
    /*
     * create a new tenant. this is a public endpoint, anyone can create one
     */
    app.post('/tenants', async (req, res) => {
      const tenantToCreate = <TenantI>req.body;
      const tenant = await Tenant.findOrCreate({
        where: {
          name: tenantToCreate.name,
          path: tenantToCreate.path,
        },
      });
      const logMessage = `Tenant ${tenant[0].id} erstellt`;
      res.status(200).send(tenant[0]);
    });

    /*
     * retrieve a tenant based on its id
     */
    app.get('/secure/tenants/:id', async (req, res) => {
      const tenant = (await Tenant.findByPk(req.params.id)) as Tenant;
      if (tenant === null) {
        res.status(404).send({ error: 'Tenant not existing' });
      } else {
        res.status(200).send(tenant);
      }
    });

    /*
     * retrieve a tenant based on its path name
     */
    app.get('/tenants/:path', async (req, res) => {
      const tenant = (await Tenant.findOne({
        where: {
          path: req.params.path,
        },
      })) as Tenant;
      if (tenant === null) {
        res.status(404).send({ error: 'Tenant not existing' });
      } else {
        res.status(200).send(tenant);
      }
    });

    /*
     * update a tenant
     */
    app.put('/secure/tenants/:id', async (req, res) => {
      const tenant = (await Tenant.findByPk(req.params.id)) as Tenant;
      if (tenant === null) {
        res.status(404).send({ error: 'Tenant not existing' });
      } else {
        // check if the user is allowed to update this tenant's information:
        if (tenant.id === (await UserService.currentTenant(req)).id) {
          const tenantChange = req.body as Tenant;
          tenant.name = tenantChange.name;
          tenant.path = tenantChange.path;
          tenant.logo = tenantChange.logo;
          tenant.save();
          res.status(200).send(tenant);
        } else {
          res.status(403).send({ message: 'You are not allowed to delete this tenant' });
        }
      }
    });

    /*
     * delete the tenant, including all its users and events (including their participants)
     */
    app.delete('/secure/tenants/:id', async (request, res) => {
      // first, check if the client is connected to the tenant he/she wants to delete:
      const tenantOfLoggedInUser = (await Tenant.findOne({
        where: { id: UserService.currentTenant(request) },
      })) as Tenant;
      // if the user does not belong to this tenant, deny the request
      if (tenantOfLoggedInUser.id === parseInt(request.params.id, 10)) {
        await Tenant.destroy({
          where: {
            id: request.params.id,
          },
        });
        const logMessage = `Tenant ${request.params.id} gelöscht`;
        Log.log(UserService.currentTenant(request), UserService.currentUser(request), logMessage);
        res.status(200).send({ message: 'Tenant deleted' });
      } else {
        // user does not belong to this tenant. Prevent it from being deleted!
        res.status(403).send({ message: 'You are not allowed to delete this tenant' });
      }
    });

    /*
     * add a new user to the tenant using self-registration, this is public
     */
    app.post('/tenants/:id/users', async (request, response) => {
      const newUser = <UserI>request.body;
      newUser.tenantId = parseInt(request.params.id);
      // make sure user doesn't exist yet
      const existingUser = (await User.findOne({ where: newUser })) as User;
      if (existingUser === null) {
        // create the user
        await UserService.createUser(newUser.tenantId, newUser.email, newUser.name, newUser.password);
        response.status(200).send({ message: 'Registration started' });
      } else {
        // a user already exists in the system, maybe for another tenant
        response.status(409).send({ error: 'User already exists in system' });
      }
    });

    /*
     * retrieve all users for a given tenant
     */
    app.get('/secure/tenants/:id/users', async (request, response) => {
      // first, check if the tenant exists
      const tenantOfLoggedInUser = (await Tenant.findOne({
        where: { id: (await UserService.currentTenant(request)).id },
      })) as Tenant;
      if (tenantOfLoggedInUser) {
        // if the user does not belong to this tenant, deny the request
        if (tenantOfLoggedInUser.id === parseInt(request.params.id, 10)) {
          const users = (await User.findAll({
            where: {
              tenantId: request.params.id,
            },
          })) as User[];
          response.status(200).send(users);
        } else {
          // user does not belong to this tenant. Prevent users showing to wrong audience
          response.status(403).send({ message: 'You are not allowed to retrieve users for this tenant' });
        }
      } else {
        response.status(404).send({ message: 'Tenant not found' });
      }
    });
  }
}
